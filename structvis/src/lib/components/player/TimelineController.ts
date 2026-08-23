import { Timeline } from 'animejs';
import type { AlgorithmEngine, StepType } from '$lib/engines/algorithm/types';

/**
 * 播放时间线控制器 — anime.js v4 Timeline 实现。
 *
 * 迁移契约（见 TimelineController.spec.ts）：
 * - seekToStep：即时落位，onProgress 精确等于目标步序号，onStep 跨界通知（双向、去重）
 * - tweenToStep：onTweenStart 同步；被 kill 后 onTweenEnd 不触达；
 *   正常完成后恰好触发一次
 * - 播放：onProgress 逐帧浮点推进，段间缓出（outQuad），终态 onFinished 恰一次
 *
 * 确定性设计：
 * - 进度求值不依赖库的回调触发语义——控制器持有分段时长表与 outQuad 解析式
 *   posAtTime(t)，任何播放头变化后统一计算并派发
 * - tweenToStep 为「真实时间驱动」的轻量步进器：进度基于 performance.now 差值，
 *   与帧率/Engine 状态解耦——帧饥饿时表现为跳切但保证精确到达
 */
export const STEP_DURATIONS: Record<StepType, number> = {
	init: 0.8,
	compare: 1.0,
	swap: 1.2,
	'pivot-select': 1.0,
	'partition-start': 1.0,
	'partition-end': 1.2,
	'recurse-enter': 0.8,
	'recurse-exit': 0.8,
	'edge-candidate': 1.1,
	'edge-select': 1.2,
	'edge-reject': 0.9,
	complete: 1.5,
	default: 1.0
};

export interface TimelineCallbacks {
	/** 播放头推进（每帧）：pos 为浮点播放位置 */
	onProgress: (pos: number) => void;
	/** 到达某个步骤（该步 tween 完成） */
	onStep: (idx: number) => void;
	/** 全部步骤播放完毕 */
	onFinished: () => void;
	/** 控制 tween（步进/跳转）开始（busy=true） */
	onTweenStart: () => void;
	/** 控制 tween 结束（busy=false）；被取消的 tween 不会触发，需调用方在 reset 时补复位 */
	onTweenEnd: () => void;
}

type SegmentEaser = (u: number) => number;

/** outQuad：u² 的互补式二次缓出（等价 gsap power2.out） */
const outQuad: SegmentEaser = (u) => u * (2 - u);

export class TimelineController {
	private tl: Timeline | null = null;
	private renderProxy = { pos: 0 };
	private lastStep = -1;
	private finishedFired = false;
	/** stepEndSeconds[i] = 播放头到达 pos=i 的秒数（idx → 时间换算表） */
	private stepEndSeconds: number[] = [];
	private engine: AlgorithmEngine<unknown>;
	private callbacks: TimelineCallbacks;
	private durations: Record<StepType, number>;
	// 控制 tween 步进器状态
	private ctrlActive = false;
	private ctrlRaf = 0;

	constructor(
		engine: AlgorithmEngine<unknown>,
		callbacks: TimelineCallbacks,
		durationsOverride?: Partial<Record<StepType, number>>
	) {
		this.engine = engine;
		this.callbacks = callbacks;
		this.durations = { ...STEP_DURATIONS, ...(durationsOverride ?? {}) };
	}

	get totalSeconds(): number {
		return this.stepEndSeconds[this.stepEndSeconds.length - 1] ?? 0;
	}

	/** 指定步骤的起始秒数（越界回退末尾） */
	secondsOf(step: number): number {
		return this.stepEndSeconds[step] ?? this.totalSeconds;
	}

	get hasTimeline(): boolean {
		return this.tl !== null;
	}

	// ---- 确定性求值：时间秒数 → 浮点播放位置（分段 outQuad） ----
	private posAtTime(t: number): number {
		const S = this.stepEndSeconds;
		if (S.length < 2) return this.renderProxy.pos;
		if (t <= S[0]) return 0;
		for (let j = S.length - 2; j >= 0; j--) {
			if (t >= S[j]) {
				const dur = S[j + 1] - S[j];
				const u = dur > 0 ? Math.min(1, (t - S[j]) / dur) : 1;
				return j + outQuad(u);
			}
		}
		return 0;
	}

	/** 步号判定：t 所处段的左端点索引（时间域，天然支持跨界去重） */
	private stepIndexAt(t: number): number {
		const S = this.stepEndSeconds;
		let k = 0;
		for (let i = 1; i < S.length; i++) {
			if (S[i] <= t + 1e-6) k = i;
			else break;
		}
		return k;
	}

	/** 统一派发：进度 + 跨界步号（幂等，重复调用无副作用） */
	private dispatch(t: number): void {
		this.callbacks.onProgress(this.posAtTime(t));
		const k = this.stepIndexAt(t);
		if (k !== this.lastStep) {
			this.lastStep = k;
			this.callbacks.onStep(k);
		}
	}

	/** 段渲染帧回调（anime Engine 主循环驱动） */
	private handleTick = (): void => {
		if (!this.tl) return;
		const t = (this.tl as unknown as { currentTime?: number }).currentTime ?? 0;
		this.dispatch(typeof t === 'number' ? t : 0);
	};

	private cancelControl(): void {
		this.ctrlActive = false;
		if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.ctrlRaf);
		this.ctrlRaf = 0;
	}

	/** 按引擎当前 steps 重建时间线（先销毁旧线，含未完成的控制 tween） */
	build(): void {
		this.destroy();
		if (this.engine.steps.length < 2) return;

		this.renderProxy.pos = 0;
		this.lastStep = -1;
		this.finishedFired = false;
		this.tl = new Timeline({
			autoplay: false,
			defaults: { ease: 'outQuad' },
			onComplete: () => {
				if (this.finishedFired) return;
				this.finishedFired = true;
				this.callbacks.onFinished();
			}
		});
		this.stepEndSeconds = [];
		let accSeconds = 0;

		for (let i = 0; i < this.engine.steps.length - 1; i++) {
			const nextStep = this.engine.steps[i + 1];
			const duration = this.durations[nextStep.type] || this.durations.default;

			this.stepEndSeconds.push(accSeconds);
			accSeconds += duration;

			// 段渲染帧回调驱动统一派发（anime Engine 主循环逐帧调用）
			this.tl.add(this.renderProxy, {
				pos: i + 1,
				duration,
				onUpdate: () => this.handleTick(),
				onRender: () => this.handleTick()
			});
		}

		this.stepEndSeconds.push(accSeconds);
	}

	/** 销毁时间线并释放 Animatable 注册 */
	destroy(): void {
		this.cancelControl();
		if (this.tl) {
			try {
				this.tl.revert();
			} catch {
				/* 未 init 的空线 revert 可能抛错，忽略 */
			}
			this.tl = null;
		}
		this.stepEndSeconds = [];
		this.lastStep = -1;
	}

	play(speed: number): void {
		if (!this.tl) return;
		// 运行时属性名为 speed（d.ts 未暴露，实测可写）
		(this.tl as unknown as { speed: number }).speed = speed;
		this.tl.play();
	}

	pause(): void {
		this.tl?.pause();
	}

	/** 瞬时跳到指定步骤（进度条拖拽/Home/End 用） */
	seekToStep(step: number): void {
		if (!this.tl) return;
		this.cancelControl();
		const t = this.secondsOf(step);
		this.tl.seek(t);
		// v4 seek 默认派发回调；此处再自持派发一次作为确定性双保险
		this.dispatch(t);
	}

	/** 平滑过渡到指定步骤（下一步/上一步用）；busy 信号经回调管理。
	 *  真实时间驱动的轻量步进器：进度基于 performance.now 差值，
	 *  与帧率/Engine 状态解耦——帧饥饿时表现为跳切但保证精确到达。 */
	tweenToStep(step: number): void {
		if (!this.tl) return;
		this.callbacks.onTweenStart();
		this.cancelControl();

		const from = (this.tl as unknown as { currentTime?: number }).currentTime ?? 0;
		const to = this.secondsOf(step);
		const duration = Math.min(500, Math.max(150, Math.abs(to - from) * 220));
		const t0 = performance.now();

		const stepFrame = () => {
			if (!this.ctrlActive) return;
			const u = Math.min(1, (performance.now() - t0) / duration);
			const eased = 1 - (1 - u) * (1 - u); // outQuad
			const t = from + (to - from) * eased;
			this.tl?.seek(t);
			this.dispatch(t);
			if (u < 1) {
				this.ctrlRaf = setTimeout(stepFrame, 16) as unknown as number;
			} else {
				this.ctrlActive = false;
				this.callbacks.onTweenEnd();
			}
		};
		this.ctrlActive = true;
		this.ctrlRaf = setTimeout(stepFrame, 16) as unknown as number;
	}

	/** 清除进行中的控制 tween（避免 seek 后退后播放头被拉回） */
	killControlTweens(): void {
		this.cancelControl();
	}

	/** 播放位置归零（供 seek(0) 场景） */
	seekStart(): void {
		this.seekToStep(0);
	}
}

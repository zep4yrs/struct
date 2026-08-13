import gsap from 'gsap';
import type { AlgorithmEngine, StepType } from '$lib/engines/algorithm/types';

/**
 * 播放时间线控制器 — 把 AlgoPlayer 中 GSAP timeline 的构建与播放控制独立成
 * 可单测模块（步长换算、tweenTo/seek 秒数语义、控制 tween 忙闲信号）。
 *
 * ⚠️ tweenTo/seek 的参数必须是时间秒数（stepEndSeconds），不是步骤序数——
 * 步骤时长不都是 1s（swap=1.2、complete=1.5），传序数会错位导致卡步/漂移。
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
	/** 控制 tween 结束（busy=false）；被 kill 的 tween 不会触发，需调用方在 reset 时补复位 */
	onTweenEnd: () => void;
}

export class TimelineController {
	private tl: gsap.core.Timeline | null = null;
	private renderProxy = { pos: 0 };
	/** stepEndSeconds[i] = 播放头到达 pos=i 的秒数（idx → 时间换算表） */
	private stepEndSeconds: number[] = [];
	private engine: AlgorithmEngine<unknown>;
	private callbacks: TimelineCallbacks;

	constructor(engine: AlgorithmEngine<unknown>, callbacks: TimelineCallbacks) {
		this.engine = engine;
		this.callbacks = callbacks;
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

	/** 按引擎当前 steps 重建时间线（先销毁旧线，含未完成的控制 tween） */
	build(): void {
		this.destroy();
		if (this.engine.steps.length < 2) return;

		this.renderProxy.pos = 0;
		this.tl = gsap.timeline({ paused: true });
		this.stepEndSeconds = [];
		let accSeconds = 0;

		for (let i = 0; i < this.engine.steps.length - 1; i++) {
			const nextStep = this.engine.steps[i + 1];
			const duration = STEP_DURATIONS[nextStep.type] || STEP_DURATIONS.default;

			this.stepEndSeconds.push(accSeconds);
			accSeconds += duration;

			this.tl.to(this.renderProxy, {
				pos: i + 1,
				duration,
				ease: 'power2.out',
				onUpdate: () => {
					this.callbacks.onProgress(this.renderProxy.pos);
				},
				onComplete: () => {
					this.callbacks.onStep(i + 1);
				}
			});
		}

		this.stepEndSeconds.push(accSeconds);
		this.tl.eventCallback('onComplete', () => this.callbacks.onFinished());
	}

	/** 销毁时间线（kill 所有 tween 与子 tween） */
	destroy(): void {
		if (this.tl) {
			// killTweensOf 一并清除 tweenTo 生成的控制 tween（getTweensOf 可能漏掉）
			gsap.killTweensOf(this.tl);
			this.tl.kill();
			this.tl = null;
		}
		this.stepEndSeconds = [];
	}

	play(speed: number): void {
		if (!this.tl) return;
		this.tl.timeScale(speed);
		this.tl.play();
	}

	pause(): void {
		this.tl?.pause();
	}

	/** 瞬时跳到指定步骤（进度条拖拽/Home/End 用） */
	seekToStep(step: number): void {
		if (!this.tl) return;
		this.tl.seek(this.secondsOf(step));
	}

	/** 平滑过渡到指定步骤（下一步/上一步用）；busy 信号经回调管理 */
	tweenToStep(step: number): void {
		if (!this.tl) return;
		this.callbacks.onTweenStart();
		this.tl.tweenTo(this.secondsOf(step), {
			onComplete: () => this.callbacks.onTweenEnd()
		});
	}

	/** 清除进行中的控制 tween（避免 seek 后退后播放头被拉回） */
	killControlTweens(): void {
		if (this.tl) gsap.killTweensOf(this.tl);
	}

	/** 播放位置归零（供 seek(0) 场景） */
	seekStart(): void {
		if (!this.tl) return;
		this.tl.seek(0);
	}
}

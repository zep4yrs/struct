import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AlgorithmEngine, StepType } from '$lib/engines/algorithm/types';

/**
 * TimelineController 特征测试（M0 · anime.js 迁移契约）
 *
 * 这些用例定义的是「迁移后」的确定性行为契约：
 * 1. 时长表纯函数语义（与引擎实现解耦）
 * 2. seekToStep 的即时进度派发（v4 seek 默认派发回调，控制器再自持幂等派发双保险）
 * 3. 步进跨界通知 onStep 恰好一次（时间域判定，双向 seek 均更新 UI 步号）
 * 4. tweenToStep 的 busy 契约：start 同步 / kill 后 end 不触达 / 完成后触达
 * 5. 完整播放：onStep 序列、终态进度、onFinished 恰一次
 */

// ---- rAF 桥接：jsdom 默认无 requestAnimationFrame，anime Engine 需要 ----
if (!globalThis.requestAnimationFrame) {
	vi.stubGlobal(
		'requestAnimationFrame',
		(cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 8) as unknown as number
	);
	vi.stubGlobal('cancelAnimationFrame', (h: number) => clearTimeout(h as unknown as number));
}

const { TimelineController } = await import('./TimelineController');

type AnyEngine = AlgorithmEngine<unknown>;

function fakeEngine(types: StepType[]): AnyEngine {
	return {
		steps: types.map((t, i) => ({ type: t, index: i })),
		totalSteps: types.length,
		reset: () => {},
		setProgress: () => {}
	} as unknown as AnyEngine;
}

function makeRecorder() {
	const progress: number[] = [];
	const steps: number[] = [];
	let finished = 0;
	let tweenStart = 0;
	let tweenEnd = 0;
	return {
		progress,
		steps,
		finishedCount: () => finished,
		tweenStartCount: () => tweenStart,
		tweenEndCount: () => tweenEnd,
		callbacks: {
			onProgress: (p: number) => progress.push(p),
			onStep: (i: number) => steps.push(i),
			onFinished: () => void finished++,
			onTweenStart: () => void tweenStart++,
			onTweenEnd: () => void tweenEnd++
		}
	};
}

// 与 STEP_DURATIONS 对应：compare=1.0, swap=1.2, complete=1.5（init 段不产生位移时长）
const TYPES: StepType[] = ['init', 'compare', 'swap', 'complete'];
const TOTAL = 3.7;

describe('TimelineController · 时长表（纯函数契约）', () => {
	it('totalSeconds = 各段时长累加', () => {
		const c = new TimelineController(fakeEngine(TYPES), makeRecorder().callbacks);
		c.build();
		expect(c.totalSeconds).toBeCloseTo(TOTAL, 6);
	});

	it('secondsOf 返回各步终点秒数，越界回退末尾', () => {
		const c = new TimelineController(fakeEngine(TYPES), makeRecorder().callbacks);
		c.build();
		expect(c.secondsOf(0)).toBeCloseTo(0, 6);
		expect(c.secondsOf(1)).toBeCloseTo(1.0, 6);
		expect(c.secondsOf(2)).toBeCloseTo(2.2, 6);
		expect(c.secondsOf(3)).toBeCloseTo(3.7, 6);
		expect(c.secondsOf(99)).toBeCloseTo(3.7, 6);
	});

	it('steps < 2 时不建线', () => {
		const c = new TimelineController(fakeEngine(['init']), makeRecorder().callbacks);
		c.build();
		expect(c.hasTimeline).toBe(false);
	});
});

describe('TimelineController · seek 即时派发（确定性自持）', () => {
	it('seekToStep(2)：onProgress 收到精确 2，onStep 跨界通知 2', () => {
		const rec = makeRecorder();
		const c = new TimelineController(fakeEngine(TYPES), rec.callbacks);
		c.build();
		c.seekToStep(2);
		expect(rec.progress.at(-1)).toBeCloseTo(2, 5);
		expect(rec.steps).toContain(2);
	});

	it('seekToStep 双向均更新步号（后退也通知，供 UI 步号同步）', () => {
		const rec = makeRecorder();
		const c = new TimelineController(fakeEngine(TYPES), rec.callbacks);
		c.build();
		c.seekToStep(3);
		c.seekToStep(0);
		expect(rec.progress.at(-1)).toBeCloseTo(0, 5);
		expect(rec.steps.at(-1)).toBe(0);
	});
});

describe('TimelineController · tweenToStep busy 契约', () => {
	it('onTweenStart 同步触发；kill 后 onTweenEnd 不触达；之后 seek 仍可用', async () => {
		const rec = makeRecorder();
		const c = new TimelineController(fakeEngine(TYPES), rec.callbacks);
		c.build();
		c.tweenToStep(3);
		expect(rec.tweenStartCount()).toBe(1);
		expect(rec.tweenEndCount()).toBe(0); // 尚未完成

		c.killControlTweens();
		c.seekToStep(1);
		expect(rec.progress.at(-1)).toBeCloseTo(1, 5);

		// 控制 tween 被 kill 后等待真实时钟，也不应有迟到的 onTweenEnd
		await new Promise((r) => setTimeout(r, 700));
		expect(rec.tweenEndCount()).toBe(0);
	});

	it('不被 kill 时完成后恰好触发一次 onTweenEnd', async () => {
		const rec = makeRecorder();
		const c = new TimelineController(fakeEngine(TYPES), rec.callbacks);
		c.build();
		c.tweenToStep(1);
		await new Promise((r) => setTimeout(r, 700));
		expect(rec.tweenEndCount()).toBe(1);
	});
});

describe('TimelineController · 完整播放（显式时间扫描）', () => {
	it('onStep 序列 [1,2,3]，终态进度=末步，onFinished 恰一次', () => {
		const rec = makeRecorder();
		const c = new TimelineController(fakeEngine(TYPES), rec.callbacks, {
			compare: 0.04,
			swap: 0.05,
			complete: 0.06,
			init: 0.02,
			default: 0.04
		});
		c.build();
		c.play(1);

		const anyC = c as unknown as { tl: { seek: (t: number) => void } };
		const total = c.totalSeconds;
		for (let t = 0; t <= total + 0.001 && rec.finishedCount() === 0; t += 0.05) {
			anyC.tl.seek(t);
			(c as unknown as { handleTick: () => void }).handleTick();
		}

		expect(rec.finishedCount()).toBe(1);
		expect(rec.steps.filter((s) => s > 0)).toEqual([1, 2, 3]);
		expect(rec.progress.at(-1)).toBeCloseTo(3, 4);
	});
});

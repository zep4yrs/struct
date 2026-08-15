import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import AlgoPlayer from './AlgoPlayer.svelte';
import { BubbleSortEngine } from '$lib/engines/algorithm/basicsort/BubbleSortEngine';
import { recordExercise, addMistake } from '$lib/stores/progress';

// GSAP 隔离 mock：timeline() 返回稳定 tl 对象；tl.to 捕获 renderProxy 与 onUpdate，
// 以便测试通过 advanceTo(n) 模拟 timeline 推进（真实环境下 playbackPos 由动画驱动）。
const gsapState = vi.hoisted(() => {
	const pendingTos: { opts: Record<string, unknown> }[] = [];
	const tlTos: { target: Record<string, number>; onUpdate?: () => void; duration?: number }[] = [];
	const tl = {
		kill: vi.fn(),
		paused: true,
		to: vi.fn((target: Record<string, number>, cfg: Record<string, unknown>) => {
			tlTos.push({
				target,
				onUpdate: cfg.onUpdate as (() => void) | undefined,
				duration: cfg.duration as number
			});
			return { kill: vi.fn() };
		}),
		eventCallback: vi.fn(),
		pause: vi.fn(),
		play: vi.fn(),
		seek: vi.fn(),
		tweenTo: vi.fn(),
		getTweensOf: vi.fn(() => []),
		timeScale: vi.fn()
	};
	return {
		tl,
		pendingTos,
		tlTos,
		timeline: vi.fn(() => tl),
		killTweensOf: vi.fn(),
		to: vi.fn((target: unknown, opts: Record<string, unknown>) => {
			pendingTos.push({ opts });
			return { kill: vi.fn() };
		}),
		firePendingTos(): void {
			while (pendingTos.length) {
				const { opts } = pendingTos.shift()!;
				(opts.onComplete as (() => void) | undefined)?.();
			}
		}
	};
});

vi.mock('gsap', () => ({ default: gsapState }));
vi.mock('$lib/stores/progress', () => ({
	recordExercise: vi.fn(),
	addMistake: vi.fn()
}));

// 模拟 timeline 动画推进到 step n：更新 renderProxy.pos 并触发 onUpdate
//（组件 onUpdate 内 playbackPos = renderProxy.pos，之后 next() 才能以新位置计算目标）
function advanceTo(n: number): void {
	for (const t of gsapState.tlTos) {
		t.target.pos = n;
		t.onUpdate?.();
	}
}

// 播放头到达 pos=idx 的秒数（与组件 stepEndSeconds 同口径）
function stepEnd(idx: number): number {
	return gsapState.tlTos.slice(0, idx).reduce((s, t) => s + (t.duration ?? 0), 0);
}

function createEngine(): BubbleSortEngine {
	const e = new BubbleSortEngine();
	e.init([5, 2, 8, 1, 9]);
	return e;
}

async function mountPlayer(topicId = 'bubble-sort') {
	const engine = createEngine();
	const result = render(AlgoPlayer, {
		props: { engine, topicId, topicName: '冒泡排序' }
	});
	await tick();
	return { engine, ...result };
}

function clickTitleBtn(container: HTMLElement, text: string) {
	const btn = [...container.querySelectorAll('.title-btn')].find((b) =>
		b.textContent?.includes(text)
	) as HTMLButtonElement;
	return fireEvent.click(btn);
}

function practiceMode(container: HTMLElement) {
	return fireEvent.click(
		[...container.querySelectorAll('.mode-btn')].find((b) => b.textContent === '练习')!
	);
}

// 进入练习模式并推进到题目步骤（stepIndex 2）：每次 next 后需 advanceTo 同步 playbackPos
async function reachQuestion(container: HTMLElement) {
	await practiceMode(container);
	const next = container.querySelector('[title="下一步 (→)"]')!;
	await fireEvent.click(next);
	advanceTo(1);
	await fireEvent.click(next);
}

beforeEach(() => {
	vi.clearAllMocks();
	gsapState.pendingTos.length = 0;
	gsapState.tlTos.length = 0;
});

afterEach(() => cleanup());

describe('AlgoPlayer 渲染', () => {
	it('显示引擎名、总步数、初始步骤描述与伪代码', async () => {
		const { container, engine } = await mountPlayer();
		expect(container.querySelector('.canvas-title')?.textContent).toBe('冒泡排序');
		expect(container.querySelector('.total-num')?.textContent).toContain(String(engine.totalSteps));
		expect(container.querySelector('.status-text')?.textContent).toBe(engine.steps[0]?.description);
		const lines = container.querySelectorAll('.line');
		expect(lines.length).toBe(engine.pseudocode.length);
		expect(lines[0]?.classList.contains('active')).toBe(true);
	});

	it('步骤编号显示为两位补零', async () => {
		const { container } = await mountPlayer();
		expect(container.querySelector('.current-num')?.textContent).toBe('01');
	});
});

describe('AlgoPlayer 模式与练习流程', () => {
	it('练习模式到达题目步骤时弹出 PracticePanel', async () => {
		const { container } = await mountPlayer();
		await practiceMode(container);
		expect(container.querySelector('.practice-overlay')).toBeNull();
		await reachQuestion(container);
		const title = container.querySelector('.question-title');
		expect(title).not.toBeNull();
		expect(title?.textContent).toBe('冒泡排序每一轮结束后，最大的元素会出现在哪里？');
	});

	it('答对：回调 recordExercise(topicId, true) 并可继续', async () => {
		const { container } = await mountPlayer();
		await reachQuestion(container);

		const options = [...container.querySelectorAll('.option')] as HTMLButtonElement[];
		await fireEvent.click(options[0]!); // 数组末尾（正确答案）
		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent?.includes('提交答案'))!
		);

		expect(recordExercise).toHaveBeenCalledWith('bubble-sort', true);
		expect(addMistake).not.toHaveBeenCalled();

		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent?.includes('继续下一步'))!
		);
		expect(container.querySelector('.practice-overlay')).toBeNull();
	});

	it('答错：回调 addMistake 且记录错题字段', async () => {
		const { container } = await mountPlayer();
		await reachQuestion(container);

		const options = [...container.querySelectorAll('.option')] as HTMLButtonElement[];
		await fireEvent.click(options[1]!); // 数组开头（错误答案）
		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent?.includes('提交答案'))!
		);

		expect(recordExercise).toHaveBeenCalledWith('bubble-sort', false);
		expect(addMistake).toHaveBeenCalledWith(
			expect.objectContaining({
				topic: '冒泡排序',
				type: 'algorithm',
				wrongAnswer: '数组开头',
				correctAnswer: '数组末尾'
			})
		);
	});

	it('演示模式不弹题', async () => {
		const { container } = await mountPlayer();
		const next = container.querySelector('[title="下一步 (→)"]')!;
		await fireEvent.click(next);
		advanceTo(1);
		await fireEvent.click(next);
		advanceTo(2);
		expect(container.querySelector('.practice-overlay')).toBeNull();
	});
});

describe('AlgoPlayer 播放控制', () => {
	it('播放/暂停切换 isPlaying 并驱动 GSAP timeline', async () => {
		const { container } = await mountPlayer();
		const playBtn = container.querySelector('[title="播放 (Space)"]') as HTMLButtonElement;
		await fireEvent.click(playBtn);
		expect(gsapState.tl.play).toHaveBeenCalledOnce();
		expect(container.querySelector('[title="暂停 (Space)"]')).not.toBeNull();

		await fireEvent.click(container.querySelector('[title="暂停 (Space)"]')!);
		expect(gsapState.tl.pause).toHaveBeenCalledOnce();
		expect(container.querySelector('[title="播放 (Space)"]')).not.toBeNull();
	});

	it('键盘 ←/→ 步进：tweenTo 目标（秒数）与步骤编号更新', async () => {
		const { container } = await mountPlayer();
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		// 第二个参数为 { onComplete } 控制 tween 忙闲信号回调
		expect(gsapState.tl.tweenTo).toHaveBeenCalledWith(
			stepEnd(1),
			expect.objectContaining({ onComplete: expect.any(Function) })
		);
		expect(container.querySelector('.current-num')?.textContent).toBe('02');

		await fireEvent.keyDown(window, { key: 'ArrowLeft' });
		expect(gsapState.tl.tweenTo).toHaveBeenCalledWith(
			stepEnd(0),
			expect.objectContaining({ onComplete: expect.any(Function) })
		);
		expect(container.querySelector('.current-num')?.textContent).toBe('01');
	});

	it('Home 重置与 End 跳到最后', async () => {
		const { container, engine } = await mountPlayer();
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		await fireEvent.keyDown(window, { key: 'Home' });
		expect(gsapState.tl.seek).toHaveBeenCalledWith(0);
		expect(engine.playbackPos).toBe(0);

		await fireEvent.keyDown(window, { key: 'End' });
		expect(gsapState.tl.seek).toHaveBeenCalledWith(stepEnd(engine.totalSteps - 1));
		expect(container.querySelector('.current-num')?.textContent).toBe(
			String(engine.totalSteps).padStart(2, '0')
		);
	});
});

describe('AlgoPlayer 演示数据弹窗', () => {
	it('打开弹窗选择示例后重建引擎并显示新数据', async () => {
		const { container } = await mountPlayer();
		// 先离开第 0 步：重建后 onComplete 将编号重置为 01，$derived 才能重新求值
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		await clickTitleBtn(container, '演示数据');
		expect(container.querySelector('[role="dialog"]')).not.toBeNull();

		await fireEvent.click(
			[...container.querySelectorAll('.preset-item')].find((b) =>
				b.textContent?.includes('示例 B')
			)!
		);
		await waitFor(() => expect(container.querySelector('[role="dialog"]')).toBeNull());
		expect(container.querySelector('.title-btn')?.textContent).toContain('示例 B');

		await tick();
		gsapState.firePendingTos();
		await waitFor(() =>
			expect(container.querySelector('.status-text')?.textContent).toContain('3 7 1 9 4 6')
		);
		expect(container.querySelector('.current-num')?.textContent).toBe('01');
	});

	it('关闭按钮关闭弹窗', async () => {
		const { container } = await mountPlayer();
		await clickTitleBtn(container, '演示数据');
		await fireEvent.click(container.querySelector('.modal-close')!);
		await waitFor(() => expect(container.querySelector('[role="dialog"]')).toBeNull());
	});

	it('点击遮罩关闭弹窗', async () => {
		const { container } = await mountPlayer();
		await clickTitleBtn(container, '演示数据');
		await fireEvent.click(container.querySelector('.modal-overlay')!);
		await waitFor(() => expect(container.querySelector('[role="dialog"]')).toBeNull());
	});
});

describe('AlgoPlayer 自定义输入弹窗', () => {
	it('应用合法输入重建数据', async () => {
		const { container } = await mountPlayer();
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		await clickTitleBtn(container, '自定义');
		const input = container.querySelector('input.custom-control') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '9, 4, 6, 2' } });
		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent === '应用')!
		);

		await waitFor(() => expect(container.querySelector('[role="dialog"]')).toBeNull());
		await tick();
		gsapState.firePendingTos();
		await waitFor(() =>
			expect(container.querySelector('.status-text')?.textContent).toContain('9 4 6 2')
		);
		expect(container.querySelector('.current-num')?.textContent).toBe('01');
	});

	it('非法输入显示错误且弹窗不关闭', async () => {
		const { container } = await mountPlayer();
		await clickTitleBtn(container, '自定义');
		const input = container.querySelector('input.custom-control') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'abc' } });
		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent === '应用')!
		);

		expect(container.querySelector('[role="dialog"]')).not.toBeNull();
		expect(container.querySelector('.custom-error')?.textContent).toBeTruthy();
	});
});

describe('AlgoPlayer 投影模式', () => {
	it('进入投影：全屏覆盖 + demoScript 旁白 + 强制演示模式', async () => {
		const { container } = await mountPlayer();
		await practiceMode(container);
		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent === '投影')!
		);

		expect(container.querySelector('.projector')).not.toBeNull();
		expect(container.querySelector('.pj-narration')?.textContent).toContain('冒泡排序的思路');
		const activeTab = container.querySelector('.mode-btn.active');
		expect(activeTab?.textContent).toBe('演示');
	});

	it('Esc 退出投影', async () => {
		const { container } = await mountPlayer();
		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent === '投影')!
		);
		expect(container.querySelector('.projector')).not.toBeNull();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(container.querySelector('.projector')).toBeNull();
	});

	it('投影内播放按钮驱动 timeline', async () => {
		const { container } = await mountPlayer();
		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent === '投影')!
		);
		const pjPlay = container.querySelector('.pj-play') as HTMLButtonElement;
		expect(pjPlay.querySelector('svg')).not.toBeNull();
		await fireEvent.click(pjPlay);
		expect(gsapState.tl.play).toHaveBeenCalledOnce();
		expect(container.querySelector('.pj-play')?.querySelector('svg')).not.toBeNull();
	});
});

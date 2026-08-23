import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import AlgoPlayer from './AlgoPlayer.svelte';
import { BubbleSortEngine } from '$lib/engines/algorithm/basicsort/BubbleSortEngine';
import { recordExercise, addMistake } from '$lib/stores/progress';

// TimelineController 隔离 mock：Fake 控制器记录调用面，
// 并提供 dispatch(pos) 模拟播放头推进（组件经 onProgress/onStep 接收）。
const tcState = vi.hoisted(() => {
	class FakeController {
		static instances: FakeController[] = [];
		callbacks: {
			onProgress: (p: number) => void;
			onStep: (i: number) => void;
			onFinished: () => void;
			onTweenStart: () => void;
			onTweenEnd: () => void;
		};
		hasTimeline = true;
		built = 0;
		destroyed = 0;
		playCalls: number[] = [];
		pauseCalls = 0;
		seeks: number[] = [];
		tweens: number[] = [];
		kills = 0;
		startSeeks = 0;
		pos = 0;

		constructor(_engine: unknown, callbacks: FakeController['callbacks']) {
			this.callbacks = callbacks;
			FakeController.instances.push(this);
		}
		build() {
			this.built++;
		}
		destroy() {
			this.destroyed++;
		}
		play(speed: number) {
			this.playCalls.push(speed);
		}
		pause() {
			this.pauseCalls++;
		}
		seekToStep(step: number) {
			this.seeks.push(step);
			this.dispatch(step);
		}
		tweenToStep(step: number) {
			this.tweens.push(step);
			this.dispatch(step); // 与真实实现一致：控制 tween 的 onUpdate 会推进到位
		}
		killControlTweens() {
			this.kills++;
		}
		seekStart() {
			this.startSeeks++;
			this.seekToStep(0);
		}
		dispatch(pos: number) {
			this.pos = pos;
			this.callbacks.onProgress(pos);
			this.callbacks.onStep(Math.round(pos));
		}
	}
	return { FakeController, instances: FakeController.instances };
});

vi.mock('./TimelineController', () => ({
	TimelineController: tcState.FakeController,
	STEP_DURATIONS: { default: 1 }
}));
vi.mock('$lib/stores/progress', () => ({
	recordExercise: vi.fn(),
	addMistake: vi.fn()
}));

// 模拟播放头推进到 pos=n（触发组件的 onProgress/onStep 回调）
function advanceTo(n: number): void {
	const inst = tcState.instances.at(-1);
	inst?.dispatch(n);
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
	tcState.instances.length = 0;
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
	it('播放/暂停切换 isPlaying 并驱动控制器 play/pause', async () => {
		const { container } = await mountPlayer();
		const playBtn = container.querySelector('[title="播放 (Space)"]') as HTMLButtonElement;
		await fireEvent.click(playBtn);
		expect(tcState.instances.at(-1)?.playCalls).toEqual([1]);
		expect(container.querySelector('[title="暂停 (Space)"]')).not.toBeNull();

		await fireEvent.click(container.querySelector('[title="暂停 (Space)"]')!);
		expect(tcState.instances.at(-1)?.pauseCalls).toBe(1);
		expect(container.querySelector('[title="播放 (Space)"]')).not.toBeNull();
	});

	it('键盘 ←/→ 步进：tweenToStep 目标步序号与步骤编号更新', async () => {
		const { container } = await mountPlayer();
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(tcState.instances.at(-1)?.tweens).toEqual([1]);
		expect(container.querySelector('.current-num')?.textContent).toBe('02');

		await fireEvent.keyDown(window, { key: 'ArrowLeft' });
		expect(tcState.instances.at(-1)?.tweens).toEqual([1, 0]);
		expect(container.querySelector('.current-num')?.textContent).toBe('01');
	});

	it('Home 重置与 End 跳到最后', async () => {
		const { container, engine } = await mountPlayer();
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		await fireEvent.keyDown(window, { key: 'Home' });
		const ctl = tcState.instances.at(-1)!;
		expect(ctl.startSeeks).toBeGreaterThanOrEqual(1);
		expect(engine.playbackPos).toBe(0);

		await fireEvent.keyDown(window, { key: 'End' });
		expect(ctl.seeks).toContain(engine.totalSteps - 1);
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

	it('投影内播放按钮驱动控制器播放', async () => {
		const { container } = await mountPlayer();
		await fireEvent.click(
			[...container.querySelectorAll('button')].find((b) => b.textContent === '投影')!
		);
		const pjPlay = container.querySelector('.pj-play') as HTMLButtonElement;
		expect(pjPlay.querySelector('svg')).not.toBeNull();
		await fireEvent.click(pjPlay);
		expect(tcState.instances.at(-1)?.playCalls.length).toBeGreaterThanOrEqual(1);
		expect(container.querySelector('.pj-play')?.querySelector('svg')).not.toBeNull();
	});
});

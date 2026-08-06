import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import ControlBar from './ControlBar.svelte';

interface Props {
	currentStep: number;
	totalSteps: number;
	isPlaying: boolean;
	speed: number;
	onPlay: () => void;
	onPause: () => void;
	onPrev: () => void;
	onNext: () => void;
	onReset: () => void;
	onJump: (step: number) => void;
	onSpeedChange: (speed: number) => void;
	disabled?: boolean;
}

function makeProps(overrides: Partial<Props> = {}): Props {
	return {
		currentStep: 3,
		totalSteps: 10,
		isPlaying: false,
		speed: 1,
		onPlay: vi.fn(),
		onPause: vi.fn(),
		onPrev: vi.fn(),
		onNext: vi.fn(),
		onReset: vi.fn(),
		onJump: vi.fn(),
		onSpeedChange: vi.fn(),
		...overrides
	};
}

beforeEach(() => cleanup());

describe('ControlBar 渲染', () => {
	it('显示当前步数与总步数', () => {
		const { container } = render(ControlBar, { props: makeProps() });
		expect(container.querySelector('.current')?.textContent).toBe('04');
		expect(container.querySelector('.total')?.textContent).toBe('10');
	});

	it('进度条宽度 = currentStep / (totalSteps - 1)', () => {
		const { container } = render(ControlBar, { props: makeProps() });
		const fill = container.querySelector('.progress-fill') as HTMLElement;
		expect(fill.style.width).toBe(`${(3 / 9) * 100}%`);
	});

	it('当前速度选项带 active 高亮', () => {
		const { container } = render(ControlBar, { props: makeProps({ speed: 1.5 }) });
		const active = container.querySelector('.speed-opt.active');
		expect(active?.textContent).toBe('1.5x');
	});
});

describe('ControlBar 按钮交互', () => {
	it('点击重置/上一步/下一步按钮触发对应回调', async () => {
		const props = makeProps();
		const { getByTitle } = render(ControlBar, { props });
		await fireEvent.click(getByTitle('重置 (Home)'));
		expect(props.onReset).toHaveBeenCalledOnce();
		await fireEvent.click(getByTitle('上一步 (←)'));
		expect(props.onPrev).toHaveBeenCalledOnce();
		await fireEvent.click(getByTitle('下一步 (→)'));
		expect(props.onNext).toHaveBeenCalledOnce();
	});

	it('播放中点击暂停按钮触发 onPause', async () => {
		const props = makeProps({ isPlaying: true });
		const { getByTitle } = render(ControlBar, { props });
		await fireEvent.click(getByTitle('暂停 (Space)'));
		expect(props.onPause).toHaveBeenCalledOnce();
		expect(props.onPlay).not.toHaveBeenCalled();
	});

	it('点击速度选项触发 onSpeedChange 并切换 active', async () => {
		const props = makeProps();
		const { container } = render(ControlBar, { props });
		const btns = [...container.querySelectorAll('.speed-opt')] as HTMLElement[];
		const two = btns.find((b) => b.textContent === '2x')!;
		await fireEvent.click(two);
		expect(props.onSpeedChange).toHaveBeenCalledWith(2);
	});

	it('点击进度条按比例触发 onJump（夹在 0 ~ total-1）', async () => {
		const props = makeProps();
		const { container } = render(ControlBar, { props });
		const track = container.querySelector('.progress-track') as HTMLElement;
		vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
			left: 0,
			width: 100,
			top: 0,
			height: 3,
			right: 100,
			bottom: 3,
			x: 0,
			y: 0,
			toJSON: () => ({})
		} as DOMRect);
		await fireEvent.mouseDown(track, { clientX: 50 });
		expect(props.onJump).toHaveBeenCalledWith(5);
	});
});

describe('ControlBar 键盘快捷键', () => {
	it('Space 播放/暂停、←/→ 步进、Home 重置、End 跳到最后', async () => {
		const props = makeProps();
		const { rerender } = render(ControlBar, { props });

		await fireEvent.keyDown(window, { key: ' ' });
		expect(props.onPlay).toHaveBeenCalledOnce();

		await rerender({ ...props, isPlaying: true });
		await fireEvent.keyDown(window, { key: ' ' });
		expect(props.onPause).toHaveBeenCalledOnce();

		await fireEvent.keyDown(window, { key: 'ArrowLeft' });
		expect(props.onPrev).toHaveBeenCalledOnce();

		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(props.onNext).toHaveBeenCalledOnce();

		await fireEvent.keyDown(window, { key: 'Home' });
		expect(props.onReset).toHaveBeenCalledOnce();

		await fireEvent.keyDown(window, { key: 'End' });
		expect(props.onJump).toHaveBeenCalledWith(9);
	});

	it('disabled 时键盘快捷键全部失效', async () => {
		const props = makeProps({ disabled: true });
		render(ControlBar, { props });
		await fireEvent.keyDown(window, { key: ' ' });
		await fireEvent.keyDown(window, { key: 'ArrowLeft' });
		await fireEvent.keyDown(window, { key: 'Home' });
		expect(props.onPlay).not.toHaveBeenCalled();
		expect(props.onPrev).not.toHaveBeenCalled();
		expect(props.onReset).not.toHaveBeenCalled();
	});
});

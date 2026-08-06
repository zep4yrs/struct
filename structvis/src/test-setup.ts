import { vi } from 'vitest';

// jsdom 缺少 matchMedia（PracticePanel 的 prefersReducedMotion 使用）
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Svelte 5 transition 依赖 Web Animations API（jsdom 未实现）
Element.prototype.animate = vi.fn(
	(): Animation =>
		({
			finished: Promise.resolve(),
			cancel: vi.fn(),
			play: vi.fn(),
			pause: vi.fn(),
			commitStyles: vi.fn(),
			persist: vi.fn(),
			reverse: vi.fn(),
			onfinish: null,
			oncancel: null,
			currentTime: 0,
			playState: 'finished',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		}) as unknown as Animation
);

// 布局相关 API 兜底（进度条点击测试依赖 getBoundingClientRect）
Element.prototype.getBoundingClientRect = vi.fn(
	(): DOMRect =>
		({
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			toJSON: () => ({})
		}) as DOMRect
);

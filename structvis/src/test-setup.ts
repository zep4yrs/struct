import { vi } from 'vitest';
import { installCanvasMock } from './test/canvas-mock';

// Canvas 渲染器测试：记录式 2D 上下文（jsdom 无 canvas 实现）
installCanvasMock();

// 渲染器通过 resolveCSSVar 读取设计 token（jsdom 无样式表，内联注入可控色值）
const TOKENS: Record<string, string> = {
	'--color-subtle': '#F3F1EC',
	'--color-line-hair': '#E5E2DB',
	'--color-line-regular': '#D4D0C8',
	'--color-danger': '#9B2226',
	'--color-academic': '#1B4965',
	'--color-success': '#2D6A4F',
	'--color-accent': '#D97706',
	'--color-ink': '#1A1A1A',
	'--color-ink-2': '#5A5A5A',
	'--color-ink-3': '#9A9A9A',
	'--color-surface': '#FFFFFF',
	'--color-paper': '#FCFAF6'
};
for (const [name, value] of Object.entries(TOKENS)) {
	document.documentElement.style.setProperty(name, value);
}

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

// Svelte 5 transition 依赖 Web Animations API（jsdom 未实现）。
// Svelte 在 animate() 返回后赋值 animation.onfinish，并在 onfinish 触发时推进
// 过渡（intro 应用关键帧 / outro 完成移除节点）；不触发则弹窗 outro 永不结束。
Element.prototype.animate = vi.fn(
	(
		_keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
		options?: KeyframeAnimationOptions
	): Animation => {
		let onfinish: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null = null;
		let cancelled = false;
		const anim = {
			finished: Promise.resolve(),
			cancel: vi.fn(() => {
				cancelled = true;
			}),
			play: vi.fn(),
			pause: vi.fn(),
			commitStyles: vi.fn(),
			persist: vi.fn(),
			reverse: vi.fn(),
			onfinish: null,
			oncancel: null,
			currentTime: 0 as number,
			playState: 'finished' as string,
			effect: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		};
		Object.defineProperty(anim, 'onfinish', {
			get: () => onfinish,
			set: (fn: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null) => {
				onfinish = fn;
			}
		});
		queueMicrotask(() => {
			if (cancelled) return;
			anim.currentTime = Number(options?.duration ?? 0);
			anim.playState = 'finished';
			onfinish?.call(anim as unknown as Animation, null as unknown as AnimationPlaybackEvent);
		});
		return anim as unknown as Animation;
	}
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

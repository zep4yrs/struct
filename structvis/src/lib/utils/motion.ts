import { animate, spring, stagger, splitText, createScope } from 'animejs';
import type { EasingParam } from 'animejs';

// ---- Scope：全站 reduced-motion 统一注册（M1 / audit-10 契约） ----
let _scope: ReturnType<typeof createScope> | null = null;

function getScope(): ReturnType<typeof createScope> | null {
	if (typeof window === 'undefined' || typeof document === 'undefined') return null;
	if (!_scope) {
		_scope = createScope({
			root: document.body,
			mediaQueries: { reduceMotion: '(prefers-reduced-motion: reduce)' }
		});
	}
	return _scope;
}

/**
 * 系统是否开启「减弱动态效果」。
 * 开启时所有入场动画应跳过（内容直接呈现，尊重无障碍设置）。
 * 优先从 Scope 媒体查询读取（响应式），fallback 到原生 matchMedia。
 */
export function prefersReducedMotion(): boolean {
	const s = getScope();
	if (s) return !!(s.matches as Record<string, boolean>)?.reduceMotion;
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

export interface RevealOptions {
	/** 延迟（ms），用于交错序列 */
	delay?: number;
	/** 起始位移（px） */
	y?: number;
	/** 动画时长（ms） */
	duration?: number;
	/** 缓动；缺省用弹簧物理（带轻微 overshoot 的弹性） */
	easing?: EasingParam;
	/** 入场完成后的循环微动效：'float' 上下漂浮 / 'breathe' 呼吸 */
	loop?: 'float' | 'breathe';
}

/** 入场完成后启用循环微动效（清除 anime 残留的内联 transform，交给 CSS 动画） */
function applyLoop(node: HTMLElement, loop: 'float' | 'breathe', delay: number) {
	node.style.transform = '';
	if (loop === 'float') {
		node.classList.add('loop-float');
		// 错相位：基础延迟 + 随机偏移，避免全部同步浮动
		node.style.setProperty('--loop-delay', delay + Math.round(Math.random() * 600) + 'ms');
	} else {
		node.classList.add('loop-breathe');
		node.style.setProperty('--loop-delay', delay + 'ms');
	}
}

/** 弹簧默认参数：轻微弹性、不弹过头 */
function springEasing() {
	return spring({ stiffness: 170, damping: 19 });
}

/**
 * Svelte action：元素入场动画（淡入 + 上浮，弹簧缓动）。
 * 用法：<div use:reveal={{ delay: 120 }}>…</div>
 * 客户端仅在挂载后执行；SSR / 减弱动效时不产生任何效果。
 */
export function reveal(node: HTMLElement, opts: RevealOptions = {}) {
	if (typeof window === 'undefined' || prefersReducedMotion()) return {};

	const { delay = 0, y = 16, duration = 640, easing, loop } = opts;

	const anim = animate(node, {
		opacity: [0, 1],
		translateY: [y, 0],
		duration,
		delay,
		ease: easing ?? springEasing(),
		onComplete: () => {
			if (loop) applyLoop(node, loop, delay);
		}
	});

	return {
		destroy() {
			anim.pause();
		}
	};
}

export interface ScrollRevealOptions extends RevealOptions {
	/** 进入视口阈值（视口高度的比例） */
	threshold?: number;
	/** 文字拆分逐字浮现（用于大标题） */
	split?: boolean;
	/** 逐字间隔（ms） */
	splitGap?: number;
}

/**
 * 把元素文本拆成逐字 span。
 * 使用 anime.js 官方 Text.splitText —— 自动加 aria-hidden + sr-only 原文（无障碍加成）。
 * includeSpaces 保留空格宽度；返回 chars 数组供逐字动画使用。
 */
function splitChars(node: HTMLElement): HTMLElement[] {
	const splitter = splitText(node, { chars: true, includeSpaces: true, accessible: true });
	return (splitter as unknown as { chars: HTMLElement[] }).chars;
}

/**
 * Svelte action：滚动驱动入场——元素滚入视口时才播放动画。
 * 解决「页面加载时一次播完、滚动下去全是静态」的问题。
 * 用法：<h2 use:revealOnScroll={{ split: true }}>…</h2>
 * 任何异常都会兜底让元素保持可见（绝不出现内容被动画锁死的情况）。
 *
 * 滚动检测说明：使用手动 scroll 监听而非 anime.js Events.onScroll——
 * 后者的设计范式是「滚动位置同步动画进度」，而本场景只需「进入视口触发一次」，
 * 两者语义不同；且我们的滚动容器是 main 元素（overflow-y-auto），非 window，
 * onScroll 需要 container 参数适配，复杂度不成比例。保留现有方案。
 */
export function revealOnScroll(node: HTMLElement, opts: ScrollRevealOptions = {}) {
	if (typeof window === 'undefined' || prefersReducedMotion()) return {};

	const {
		delay = 0,
		y = 24,
		duration = 700,
		threshold = 0.9,
		easing,
		split = false,
		splitGap = 26,
		loop
	} = opts;

	node.style.opacity = '0';
	let played = false;
	// split 模式：字符只拆一次，之后重播直接复用
	let splitSpans: HTMLElement[] | null = null;

	const play = () => {
		const r = node.getBoundingClientRect();
		const inView = r.top < window.innerHeight * threshold && r.bottom > 0;

		if (!inView) {
			// 滚出视口：重置并隐藏，下次进入重新播放（滚动动画可反复触发）
			if (played) {
				played = false;
				node.style.opacity = '0';
			}
			return;
		}
		if (played) return;
		played = true;
		try {
			const common = { duration, ease: easing ?? springEasing() };
			if (split) {
				// 逐字拆分浮现（官方 splitText，动画走 anime spring + stagger）
				if (!splitSpans) {
					splitSpans = splitChars(node);
				}
				node.style.opacity = '1'; // 父层先可见，动画作用于子字符
				animate(splitSpans, {
					opacity: [0, 1],
					translateY: [20, 0],
					rotateX: [40, 0],
					...common,
					delay: stagger(splitGap, { start: delay })
				});
			} else {
				animate(node, {
					opacity: [0, 1],
					translateY: [y, 0],
					...common,
					delay,
					onComplete: () => {
						if (loop) applyLoop(node, loop, delay);
					}
				});
			}
		} catch {
			// 兜底：任何异常都保证元素可见
			node.style.opacity = '1';
		}
	};

	// 实际滚动容器是 window（html）
	const onScrollHandler = () => play();
	const onResizeHandler = () => play();
	window.addEventListener('scroll', onScrollHandler, { passive: true });
	window.addEventListener('resize', onResizeHandler);
	// 初始检查：已在视口内立即播放
	play();

	return {
		destroy() {
			window.removeEventListener('scroll', onScrollHandler);
			window.removeEventListener('resize', onResizeHandler);
		}
	};
}

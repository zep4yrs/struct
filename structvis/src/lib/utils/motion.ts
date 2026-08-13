import { animate, spring, stagger } from 'animejs';
import type { EasingParam } from 'animejs';

/**
 * 系统是否开启「减弱动态效果」。
 * 开启时所有入场动画应跳过（内容直接呈现，尊重无障碍设置）。
 */
export function prefersReducedMotion(): boolean {
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

	const { delay = 0, y = 16, duration = 640, easing } = opts;

	const anim = animate(node, {
		opacity: [0, 1],
		translateY: [y, 0],
		duration,
		delay,
		ease: easing ?? springEasing()
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

/** 把元素文本拆成逐字 span（inline-block，保留空格宽度） */
function splitChars(node: HTMLElement): HTMLElement[] {
	const text = node.textContent ?? '';
	node.textContent = '';
	const spans: HTMLElement[] = [];
	for (const ch of text) {
		const s = document.createElement('span');
		s.textContent = ch === ' ' ? '\u00A0' : ch;
		s.style.display = 'inline-block';
		node.appendChild(s);
		spans.push(s);
	}
	return spans;
}

/**
 * Svelte action：滚动驱动入场——元素滚入视口时才播放动画。
 * 解决「页面加载时一次播完、滚动下去全是静态」的问题。
 * 用法：<h2 use:revealOnScroll={{ split: true }}>…</h2>
 * 任何异常都会兜底让元素保持可见（绝不出现内容被动画锁死的情况）。
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
		splitGap = 26
	} = opts;

	node.style.opacity = '0';
	let played = false;

	const play = () => {
		if (played) return;
		const r = node.getBoundingClientRect();
		if (r.top >= window.innerHeight * threshold || r.bottom <= 0) return;
		played = true;
		try {
			const common = { duration, ease: easing ?? springEasing() };
			if (split) {
				// 逐字拆分浮现（拆分自实现，动画走 anime spring + stagger）
				const chars = splitChars(node);
				node.style.opacity = '1'; // 父层先可见，动画作用于子字符
				animate(chars, {
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
					delay
				});
			}
		} catch {
			// 兜底：任何异常都保证元素可见
			node.style.opacity = '1';
		}
	};

	// 实际滚动容器是 window（html）
	const onScroll = () => play();
	const onResize = () => play();
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onResize);
	// 初始检查：已在视口内立即播放
	play();

	return {
		destroy() {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		}
	};
}

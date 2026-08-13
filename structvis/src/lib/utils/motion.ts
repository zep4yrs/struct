import { animate } from 'animejs';

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
	/** 起始下移距离（px） */
	y?: number;
	/** 动画时长（ms） */
	duration?: number;
	/** anime.js 缓动名 */
	easing?: string;
}

/**
 * Svelte action：元素入场动画（淡入 + 上浮）。
 * 用法：<div use:reveal={{ delay: 120 }}>…</div>
 * 客户端仅在挂载后执行；SSR / 减弱动效时不产生任何效果。
 */
export function reveal(node: HTMLElement, opts: RevealOptions = {}) {
	if (typeof window === 'undefined' || prefersReducedMotion()) return {};

	const { delay = 0, y = 16, duration = 640, easing = 'easeOutExpo' } = opts;

	const anim = animate(node, {
		opacity: [0, 1],
		translateY: [y, 0],
		duration,
		delay,
		easing
	});

	return {
		destroy() {
			anim.pause();
		}
	};
}

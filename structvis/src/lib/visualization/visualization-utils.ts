import { browser } from '$app/environment';

/** 把 #RRGGBB 转成带透明度的 rgba()（渲染器主题化用；非 hex 原样返回） */
export function hexToRgba(hex: string, alpha: number): string {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!m) return hex;
	const n = parseInt(m[1], 16);
	const r = (n >> 16) & 255;
	const g = (n >> 8) & 255;
	const b = n & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 读取 CSS 设计 token（暗色主题切换后需重新读取）
 */
export function resolveCSSVar(name: string): string {
	if (!browser) return '#999';
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#999';
}

/**
 * 监听 <html class="..."> 变化（暗/亮主题切换），回调中重取色并重绘
 * 返回取消函数
 */
export function watchThemeChange(cb: () => void): () => void {
	if (!browser) return () => {};
	const el = document.documentElement;
	const observer = new MutationObserver(() => cb());
	observer.observe(el, { attributes: true, attributeFilter: ['class'] });
	return () => observer.disconnect();
}

/**
 * 统一 Canvas 渲染器的尺寸监听：window resize + 容器 ResizeObserver（侧栏折叠、
 * 移动端键盘弹出等容器尺寸变化也会触发重绘，避免位图与 CSS 尺寸脱节）。
 * 返回取消函数（onDestroy 中调用）。
 */
export function watchCanvasSize(
	getCanvas: () => HTMLCanvasElement | undefined,
	onResize: () => void
): () => void {
	if (!browser) return () => {};
	const onWindowResize = () => onResize();
	window.addEventListener('resize', onWindowResize);
	let observer: ResizeObserver | null = null;
	const parent = getCanvas()?.parentElement ?? null;
	if (typeof ResizeObserver !== 'undefined' && parent) {
		observer = new ResizeObserver(() => onResize());
		observer.observe(parent);
	}
	return () => {
		window.removeEventListener('resize', onWindowResize);
		observer?.disconnect();
	};
}

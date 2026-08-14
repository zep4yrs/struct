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

/** 解析颜色字符串为 RGBA 分量（支持 #RRGGBB / rgb() / rgba()） */
export function parseColorStr(c: string): { r: number; g: number; b: number; a: number } | null {
	const hex = c.match(/^#([0-9a-fA-F]{6})$/);
	if (hex) {
		const n = parseInt(hex[1], 16);
		return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
	}
	const rgb = c.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/);
	if (rgb) {
		return {
			r: Math.round(Number(rgb[1])),
			g: Math.round(Number(rgb[2])),
			b: Math.round(Number(rgb[3])),
			a: rgb[4] !== undefined ? Number(rgb[4]) : 1
		};
	}
	return null;
}

/** 颜色插值：两端点返回原值（保持 hex 格式），中间帧返回插值颜色 */
export function lerpColorStr(a: string, b: string, t: number): string {
	if (t <= 0) return a;
	if (t >= 1) return b;
	const pa = parseColorStr(a);
	const pb = parseColorStr(b);
	if (!pa || !pb) return t < 0.5 ? a : b;
	const r = Math.round(pa.r + (pb.r - pa.r) * t);
	const g = Math.round(pa.g + (pb.g - pa.g) * t);
	const bl = Math.round(pa.b + (pb.b - pa.b) * t);
	const al = pa.a + (pb.a - pa.a) * t;
	return al < 1 ? `rgba(${r}, ${g}, ${bl}, ${al.toFixed(3)})` : `rgb(${r}, ${g}, ${bl})`;
}

/** 步骤间进度：由 playbackPos 计算 from/to 步骤索引与插值进度 t */
export function stepProgress(
	playbackPos: number,
	stepsLength: number
): { fromIdx: number; toIdx: number; t: number } {
	const pos = Math.max(0, Math.min(stepsLength - 1 + 0.999, playbackPos));
	const fromIdx = Math.floor(pos);
	const toIdx = Math.min(fromIdx + 1, stepsLength - 1);
	return { fromIdx, toIdx, t: pos - fromIdx };
}

import { browser } from '$app/environment';

/** 把 #RRGGBB 转成带透明度的 rgba()（渲染器主题化用；非颜色串原样返回） */
export function hexToRgba(hex: string, alpha: number): string {
	const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
	if (m) {
		const n = parseInt(m[1], 16);
		const r = (n >> 16) & 255;
		const g = (n >> 8) & 255;
		const b = n & 255;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}
	// 已是 rgb()/rgba() 等解析态颜色：换算透明度后重排
	const p = parseColorStr(hex);
	if (p) return `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
	return hex;
}

/**
 * 读取 CSS 设计 token 并解析为可赋给 canvas fillStyle 的 rgb()/rgba() 串。
 * token 可能是 color-mix()/var() 嵌套等新语法（亮暗主题均如此），把原文直接
 * 赋给 fillStyle 会被 Canvas 静默丢弃并沿用旧色——暗色画布整层不可见的根因。
 */
export function resolveCSSVar(name: string): string {
	if (!browser) return '#999';
	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	if (!raw) return '#999';
	// hex / 逗号 rgb() 等 canvas 原生可吃的串原样返回（存量行为零扰动），
	// 只有 color-mix()/color(srgb)/空格形等新语法才走浏览器探针
	if (parseColorStr(raw)) return raw;
	const parsed = resolveTokenColor(raw);
	if (!parsed) return raw; // 非颜色 token（字体名等）原样返回
	return parsed.a < 1
		? `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${Number(parsed.a.toFixed(3))})`
		: `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`;
}

let colorProbe: HTMLSpanElement | null = null;

/**
 * 任意 CSS 颜色串（hex / rgb() / color-mix() / color(srgb) / var() 嵌套…）
 * → RGBA 分量。交给真实元素让浏览器计算，规避手写解析对新语法的覆盖缺口。
 * 无 DOM（SSR/单测）或值非法时返回 null。
 */
export function resolveTokenColor(
	value: string
): { r: number; g: number; b: number; a: number } | null {
	if (!browser || !value) return null;
	colorProbe ??= (() => {
		const el = document.createElement('span');
		el.setAttribute('aria-hidden', 'true');
		el.style.cssText =
			'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden';
		document.documentElement.appendChild(el);
		return el;
	})();
	colorProbe.style.color = '';
	colorProbe.style.color = value;
	if (!colorProbe.style.color) return null; // 非法值被 CSSOM 丢弃
	const computed = getComputedStyle(colorProbe).color;
	// rgb(r, g, b) / rgba(r, g, b, a)（浏览器规范输出形）
	let m = computed.match(/^rgba?\(([^)]+)\)$/i);
	if (m) {
		const parts = m[1]
			.split(/[\s,/]+/)
			.filter(Boolean)
			.map(Number);
		if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(n))) {
			return {
				r: Math.round(parts[0]),
				g: Math.round(parts[1]),
				b: Math.round(parts[2]),
				a: parts.length > 3 ? parts[3] : 1
			};
		}
	}
	// color(srgb r g b [/ a])（广色域输出兜底，srgb 分量 0~1）
	m = computed.match(/^color\(\s*srgb\s+([^)]+)\)$/i);
	if (m) {
		const parts = m[1]
			.split(/[\s/]+/)
			.filter(Boolean)
			.map(Number);
		if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(n))) {
			return {
				r: Math.round(parts[0] * 255),
				g: Math.round(parts[1] * 255),
				b: Math.round(parts[2] * 255),
				a: parts.length > 3 ? parts[3] : 1
			};
		}
	}
	return null;
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

/** 解析颜色字符串为 RGBA 分量（hex / rgb() / color-mix() / color(srgb) / var() 嵌套…） */
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
	// 新语法（color-mix()/color(srgb)/空格形 rgb()）交给浏览器计算
	return resolveTokenColor(c);
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

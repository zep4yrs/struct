import { browser } from '$app/environment';

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

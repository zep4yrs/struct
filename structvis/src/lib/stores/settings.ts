import { get, writable } from 'svelte/store';
import { persistentStore } from './persistent';

export interface Settings {
	theme: 'light' | 'dark';
	sqlEngine: 'sqljs'; // 目前只有 sql.js，预留 mysql
	animationSpeed: number; // 动画速度 0.5 ~ 2
	showHints: boolean; // 是否默认显示提示
	particleBackground: boolean; // 全站 three.js 粒子背景（低端设备可关，audit-14）
	openingAnimation: boolean; // 首页开屏动画（首次访问播放，可跳过）
	openingSound: boolean; // 开屏动画音效（Web Audio 合成）
}

const defaultSettings: Settings = {
	theme: 'light',
	sqlEngine: 'sqljs',
	animationSpeed: 1,
	showHints: true,
	particleBackground: true,
	openingAnimation: true,
	openingSound: true
};

export const settings = persistentStore<Settings>('structvis:settings', defaultSettings);

/** 主题切换遮罩动画指令（ThemeVeil 组件消费）：idle = 无动画 */
export const themeVeil = writable<'idle' | 'to-dark' | 'to-light'>('idle');

let veilBusy = false;

function flipTheme(next: 'light' | 'dark'): void {
	settings.update((s) => ({ ...s, theme: next }));
}

/** 遮罩动画可用性：单测/webdriver 自动化/reduced-motion 一律即时切换（e2e 与无障碍优先） */
function veilEnabled(): boolean {
	if (typeof window === 'undefined') return false;
	if (import.meta.env?.VITEST) return false;
	if ((navigator as Navigator & { webdriver?: boolean }).webdriver === true) return false;
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function toggleTheme(): void {
	const next: 'light' | 'dark' = get(settings).theme === 'light' ? 'dark' : 'light';
	if (!veilEnabled() || veilBusy) {
		flipTheme(next);
		return;
	}
	veilBusy = true;
	themeVeil.set(next === 'dark' ? 'to-dark' : 'to-light');
}

/** ThemeVeil 在遮罩完全覆盖的瞬间回调：此刻才真正落主题（揭幕即新主题，无闪烁） */
export function settleThemeVeil(next: 'light' | 'dark'): void {
	flipTheme(next);
}

export function endThemeVeil(): void {
	themeVeil.set('idle');
	veilBusy = false;
}

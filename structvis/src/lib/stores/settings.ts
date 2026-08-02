import { persistentStore } from './persistent';

export interface Settings {
	theme: 'light' | 'dark';
	sqlEngine: 'sqljs'; // 目前只有 sql.js，预留 mysql
	animationSpeed: number; // 动画速度 0.5 ~ 2
	showHints: boolean; // 是否默认显示提示
}

const defaultSettings: Settings = {
	theme: 'light',
	sqlEngine: 'sqljs',
	animationSpeed: 1,
	showHints: true
};

export const settings = persistentStore<Settings>('structvis:settings', defaultSettings);

export function toggleTheme(): void {
	settings.update((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
}

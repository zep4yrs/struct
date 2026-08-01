import { persistentStore } from './persistent';

export interface Settings {
	theme: 'light'; // 目前只有亮色，预留扩展
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

import { engine } from 'animejs';

/**
 * anime.js Engine 全局配置（客户端一次性调用）。
 *
 * 仅设置自动化豁免：Playwright 并行下后台页被库判 hidden 导致动画冻结，
 * webdriver 环境关闭该行为。真实用户保留后台省电语义。
 * 主循环由 anime.js 内部管理（useDefaultMainLoop 默认 true）。
 */
export function configureAnimEngine(): void {
	if (typeof window === 'undefined') return;

	const w = window as unknown as Record<string, unknown>;
	const isAutomated =
		w.__DSH_NO_SCENE__ === '1' ||
		(navigator as Navigator & { webdriver?: boolean }).webdriver === true;
	if (isAutomated) {
		engine.pauseOnDocumentHidden = false;
	}
}

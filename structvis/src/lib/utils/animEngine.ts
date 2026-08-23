import { engine } from 'animejs';

/**
 * anime.js Engine 全局接管（客户端一次性调用）。
 *
 * 设计：关闭库自带主循环，改由本模块的唯一 rAF 泵驱动 `engine.update()`：
 * - rAF 让出主线程给 SvelteKit 水合与用户交互（setInterval 会持续占队列）
 * - 帧饥饿钳制：单帧 dt>34ms 时动态调低 engine.speed 防止时间线瞬移
 * - document.hidden 且非自动化环境时跳过 update
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

	engine.useDefaultMainLoop = false;

	let last = performance.now();
	const tick = () => {
		const now = performance.now();
		const dt = now - last;
		last = now;

		if (dt > 34) engine.speed = Math.max(0.05, 34 / dt);
		else if (engine.speed !== 1) engine.speed = 1;

		const hidden = document.hidden && !isAutomated;
		if (!hidden) engine.update();

		requestAnimationFrame(tick);
	};

	requestAnimationFrame(tick);
}

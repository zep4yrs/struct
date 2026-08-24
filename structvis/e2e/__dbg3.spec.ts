import { test, expect } from '@playwright/test';

test('debug play flow', async ({ page }) => {
	const logs: string[] = [];
	page.on('console', (m) => {
		if (m.text().includes('[TC]') || m.text().includes('[player]'))
			logs.push(m.text().slice(0, 120));
	});
	page.on('pageerror', (e) => logs.push('[PAGEERROR] ' + String(e).slice(0, 200)));
	await page.goto('/struct/ds/bubble-sort');
	await page.waitForSelector('body[data-player-ready="1"]', { timeout: 30000 });
	logs.push('--- data-ready confirmed ---');
	await page.getByTitle('播放 (Space)').click();
	await page.waitForTimeout(2000);
	console.log('ALL LOGS:\n' + logs.join('\n'));
	expect(logs.some((l) => l.includes('[TC] play called'))).toBe(true);
});

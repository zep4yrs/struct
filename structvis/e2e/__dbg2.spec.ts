import { test, expect } from '@playwright/test';

test('debug hydrate chain', async ({ page }) => {
	const msgs: string[] = [];
	page.on('console', (m) => {
		msgs.push(`[${m.type()}] ${m.text().slice(0, 160)}`);
	});
	page.on('pageerror', (e) => msgs.push(`[PAGEERROR] ${String(e).slice(0, 300)}`));
	await page.goto('/struct/ds/bubble-sort');
	await page.waitForTimeout(1200);

	const diag = await page.evaluate(() => {
		const q = (s: string) => document.querySelector(s);
		const rect = (s: string) => {
			const el = q(s);
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
		};
		const el2 = document.querySelector('[title="下一步 (→)"]') as HTMLElement | null;
		let topEl: string | null = null;
		if (el2) {
			const r = el2.getBoundingClientRect();
			const c = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
			topEl = c ? `${c.tagName}.${String(c.className).slice(0, 40)}` : null;
		}
		return {
			hasPlayer: !!q('.algo-player'),
			nextRect: rect('[title="下一步 (→)"]'),
			currentNum: q('.current-num')?.textContent ?? null,
			coach: !!q('.coach-root'),
			practice: !!q('.practice-overlay'),
			topAtNextCenter: topEl
		};
	});
	console.log('DIAG:', JSON.stringify(diag));

	const seq: string[] = [];
	const next = page.getByTitle('下一步 (→)');
	await expect(async () => {
		await next.click();
		const n = await page.locator('.current-num').first().textContent();
		seq.push(`${n}@${Date.now() % 100000}`);
		if (n !== '02') throw new Error('尚未水合 ' + n);
	}).toPass({ timeout: 6000 });

	console.log('SEQ:', seq.join(' → '));
	console.log('CONSOLE TAIL:', msgs.slice(-10).join('\n'));
});

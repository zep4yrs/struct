import { test, expect, type Page } from '@playwright/test';

/* 移动端教学内容适配回归（M0.5）：
   375×667 · isMobile：ControlBar 不溢出、44px 热区、速度行独立、底部导航避让、抽屉可用 */

const MOBILE = { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true };

async function openBubbleSortMobile(page: Page) {
	await page.goto('/struct/ds/bubble-sort');
	await page.waitForSelector('body[data-player-ready="1"]', { timeout: 30000 });
	// 滚动到底部以让控制条进入视口（与滚动位置无关的断言除外）
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForTimeout(300);
}

test.describe('播放器移动端适配（375×667）', () => {
	test.use(MOBILE);

	test('控制条不横向溢出且热区 ≥40px', async ({ page }) => {
		await openBubbleSortMobile(page);
		const sizes = await page.evaluate(() => {
			const cb = document.querySelector('.control-bar')!.getBoundingClientRect();
			const btns = [...document.querySelectorAll('.control-bar .icon-btn, .control-bar .play-btn')].map(
				(b) => b.getBoundingClientRect().width
			);
			return {
				cbRight: Math.round(cb.right),
				vw: window.innerWidth,
				btns
			};
		});
		expect(sizes.cbRight).toBeLessThanOrEqual(sizes.vw + 1);
		for (const w of sizes.btns) {
			expect(w).toBeGreaterThanOrEqual(40);
		}
	});

	test('速度组在小屏独占一行', async ({ page }) => {
		await openBubbleSortMobile(page);
		const rows = await page.evaluate(() => {
			const main = document.querySelector('.ctrl-buttons')!.getBoundingClientRect();
			const sub = document.querySelector('.right-controls')!.getBoundingClientRect();
			return { mainBottom: main.bottom, subTop: sub.top };
		});
		expect(rows.subTop).toBeGreaterThanOrEqual(rows.mainBottom - 4);
	});

	test('控制条与底部导航无重叠（滚动到底）', async ({ page }) => {
		await openBubbleSortMobile(page);
		const r = await page.evaluate(() => {
			const cb = document.querySelector('.control-bar')!.getBoundingClientRect();
			const nav = document.querySelector('.bottom-nav')!.getBoundingClientRect();
			return { cbBottom: cb.bottom, navY: nav.y };
		});
		expect(r.cbBottom).toBeLessThanOrEqual(r.navY + 1);
	});

	test('「⋯」抽屉：展开含重置/朗读/帮助并可用', async ({ page }) => {
		await openBubbleSortMobile(page);
		const more = page.locator('.more-btn');
		await expect(more).toBeVisible();
		await more.click();
		const drawer = page.locator('.more-drawer');
		await expect(drawer).toBeVisible();
		const items = await drawer.locator('.more-item').allTextContents();
		expect(items).toContain('重置');
		expect(items).toContain('朗读');
		expect(items).toContain('帮助');
		// 重置可用：先到 02，再开抽屉点重置回到 01
		await page.locator('[title="下一步 (→)"]').click();
		await expect(page.locator('.step-count .current')).toHaveText('02');
		await more.click();
		await drawer.locator('.more-item', { hasText: '重置' }).click();
		await expect(page.locator('.step-count .current')).toHaveText('01');
	});

	test('播放/暂停按钮在移动视口可用', async ({ page }) => {
		await openBubbleSortMobile(page);
		await page.locator('[title="播放 (Space)"]').click();
		await expect(page.locator('[title="暂停 (Space)"]')).toBeVisible();
		await page.locator('[title="暂停 (Space)"]').click();
		await expect(page.locator('[title="播放 (Space)"]')).toBeVisible();
	});
});
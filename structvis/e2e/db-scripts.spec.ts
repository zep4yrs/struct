import { test, expect } from '@playwright/test';

/**
 * M2.13 — SQL 剧本主题冒烟：每主题一条（页可达 → 剧本装载 → 帧步进 → 零 JS 错误）。
 * 新主题落地后在此表登记一行即可。
 * 注：sql.js 未安装时页面走静态演示帧，冒烟同样应通过（架构要求双模式行为一致）。
 */
const SCRIPT_TOPICS: { slug: string; title: string; frames: number }[] = [
	{ slug: 'union-set', title: 'SQL 集合运算', frames: 5 },
	{ slug: 'case-expr', title: 'CASE 表达式', frames: 4 },
	{ slug: 'sql-functions', title: 'SQL 函数演练', frames: 4 },
	{ slug: 'having-deep', title: 'WHERE 与 HAVING', frames: 4 },
	{ slug: 'distinct-paging', title: 'DISTINCT 与分页', frames: 5 },
	{ slug: 'join-variants', title: 'JOIN 家族', frames: 6 },
	{ slug: 'view-update', title: '视图更新限制', frames: 6 },
	{ slug: 'index-fail', title: '索引失效实验', frames: 6 },
	{ slug: 'explain-detail', title: 'EXPLAIN 详解', frames: 6 },
	{ slug: 'constraints', title: '约束体系', frames: 6 }
];

for (const { slug, title } of SCRIPT_TOPICS) {
	test(`DB 剧本冒烟：${slug}`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(String(e)));

		await page.goto(`/struct/db/${slug}`);
		await expect(page.getByRole('heading', { name: title })).toBeVisible();

		// 剧本装载（sql.js 或静态回落）→ 播放器就绪
		await expect(page.locator('.algo-player')).toBeVisible({ timeout: 20000 });
		await page.locator('body[data-player-ready="1"]').waitFor();

		// 帧步进：从 01 前进到 03；每次点击间等待控制 tween 落定（tweenBusy 契约，
		// 否则 floor(playbackPos) 未到目标步会吞掉下一次步进——历史 flaky 根因）
		await expect(page.locator('.step-count .current')).toHaveText('01');
		const nextBtn = page.locator('[title="下一步 (→)"]');
		const settle = () =>
			expect(page.locator('.canvas-body')).toHaveAttribute('data-tween-busy', 'false', {
				timeout: 5000
			});
		await nextBtn.click();
		await settle();
		await expect(page.locator('.step-count .current')).toHaveText('02');
		await nextBtn.click();
		await settle();
		await expect(page.locator('.step-count .current')).toHaveText('03');
		await expect(page.locator('.status-text')).not.toBeEmpty();

		expect(errors, `页面 JS 错误: ${errors.join('; ')}`).toEqual([]);
	});
}

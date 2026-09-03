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
	{ slug: 'constraints', title: '约束体系', frames: 6 },
	{ slug: 'index-query', title: '索引查询与回表', frames: 6 },
	{ slug: 'lock-gantt', title: '锁等待与死锁甘特图', frames: 6 },
	{ slug: 'serial-schedule', title: '可串行化调度', frames: 12 },
	{ slug: 'workbench', title: 'SQL 工作台', frames: -1 },
	{ slug: 'advanced-query', title: '高级查询', frames: 5 },
	{ slug: 'window-function', title: '窗口函数', frames: 5 },
	{ slug: 'update', title: '数据更新', frames: 5 },
	{ slug: 'view', title: '视图创建与使用', frames: 5 },
	{ slug: 'triggers', title: '触发器', frames: 5 },
	{ slug: 'procedures', title: '存储过程', frames: 4 }
];

for (const { slug, title, frames } of SCRIPT_TOPICS) {
	test(`DB 剧本冒烟：${slug}`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(String(e)));

		await page.goto(`/struct/db/${slug}`);
		await expect(page.getByRole('heading', { name: title })).toBeVisible();

		if (frames < 0) {
			// 工作台形态：三栏渲染 + 关卡列表就绪（非播放器页）
			await expect(page.locator('.wb-grid')).toBeVisible({ timeout: 20000 });
			await expect(page.locator('.level-item').first()).toBeVisible();
			await expect(page.getByLabel('SQL 编辑器')).toBeVisible();
			expect(errors, `页面 JS 错误: ${errors.join('; ')}`).toEqual([]);
			return;
		}

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

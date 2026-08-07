import { test, expect, type Page } from '@playwright/test';

// vite dev 冷启动首编时模块图尚未就绪，页面已 SSR 渲染但事件系统未水合。
// 通过功能探测等待水合完成：点击「下一步」直到步骤编号响应，随后 Home 复位。
async function waitForHydrated(page: Page) {
	const next = page.getByTitle('下一步 (→)');
	await expect(async () => {
		await next.click();
		const n = await page.locator('.current-num').first().textContent();
		if (n !== '02') throw new Error('尚未水合');
	}).toPass({ timeout: 30000 });
	await page.keyboard.press('Home');
	await expect(page.locator('.current-num')).toHaveText('01');
}

// 无播放器页面（首页/进度页）：用主题开关探测水合，探测后恢复亮色
async function waitForHydratedGlobal(page: Page) {
	const btn = page.getByRole('button', { name: '切换到暗色主题' });
	await expect(async () => {
		await btn.click();
		await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 1000 });
	}).toPass({ timeout: 30000 });
	// 此时页面已变暗，按钮文案随之变化，需按新名字查找恢复
	await page.getByRole('button', { name: '切换到亮色主题' }).click();
	await expect(page.locator('html')).not.toHaveClass(/dark/);
}

// 等待播放器当前步骤的 tween 动画播完（步长 1s），使 playbackPos 与步骤号对齐，
// 否则连续步进时 floor(playbackPos)+1 仍指向旧步骤。
async function settleTween(page: Page) {
	await page.waitForTimeout(1300);
}

async function openBubbleSort(page: Page) {
	await page.goto('/struct/ds/bubble-sort');
	await expect(page.getByRole('heading', { name: '冒泡排序' })).toBeVisible();
	await expect(page.locator('.algo-player')).toBeVisible();
	await waitForHydrated(page);
}

async function clickNext(page: Page) {
	await page.getByTitle('下一步 (→)').click();
}

test.describe('页面加载', () => {
	test('首页：标题、口号与两门课程区块', async ({ page }) => {
		await page.goto('/');
		await waitForHydratedGlobal(page);
		await expect(page.getByRole('heading', { name: /StructVis/ })).toBeVisible();
		await expect(page.getByText('看见数据结构与数据库的每一步跳动')).toBeVisible();
		await expect(page.getByRole('heading', { name: '数据结构与算法' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'MySQL 数据库' })).toBeVisible();
	});

	test('冒泡排序页：播放器渲染引擎名/总步数/伪代码', async ({ page }) => {
		await openBubbleSort(page);
		await expect(page.locator('.canvas-title')).toHaveText('冒泡排序');
		await expect(page.locator('.current-num')).toHaveText('01');
		await expect(page.locator('.pseudocode .line')).toHaveCount(9);
	});
});

test.describe('播放器交互', () => {
	test('下一步推进：步骤编号与伪代码激活行同步', async ({ page }) => {
		await openBubbleSort(page);
		await clickNext(page);
		await expect(page.locator('.current-num')).toHaveText('02');
		await expect(page.locator('.line.active')).toHaveCount(1);
		await settleTween(page);

		await page.keyboard.press('ArrowRight');
		await expect(page.locator('.current-num')).toHaveText('03');

		await page.keyboard.press('Home');
		await expect(page.locator('.current-num')).toHaveText('01');
	});

	test('播放/暂停：按钮图标切换且步骤自动推进', async ({ page }) => {
		await openBubbleSort(page);
		await page.getByTitle('播放 (Space)').click();
		await expect(page.getByTitle('暂停 (Space)')).toBeVisible();
		await expect(page.locator('.current-num')).not.toHaveText('01', { timeout: 5000 });
		await page.getByTitle('暂停 (Space)').click();
		await expect(page.getByTitle('播放 (Space)')).toBeVisible();
	});

	test('演示数据弹窗：选择示例 B 后数据与编号重建', async ({ page }) => {
		await openBubbleSort(page);
		await clickNext(page);
		await expect(page.locator('.current-num')).toHaveText('02');

		await page.locator('.title-btn', { hasText: '演示数据' }).click();
		await expect(page.getByRole('dialog', { name: '演示数据' })).toBeVisible();
		await page.locator('.preset-item', { hasText: '示例 B' }).click();
		await expect(page.getByRole('dialog', { name: '演示数据' })).toBeHidden();

		await expect(page.locator('.title-btn', { hasText: '示例 B' })).toContainText('示例 B');
		await expect(page.locator('.status-text')).toContainText('3 7 1 9 4 6');
		await expect(page.locator('.current-num')).toHaveText('01');
	});

	test('自定义输入：合法数据重建，非法输入报错不关闭', async ({ page }) => {
		await openBubbleSort(page);
		await page.locator('.title-btn', { hasText: '自定义' }).click();
		await expect(page.getByRole('dialog', { name: /自定义/ })).toBeVisible();

		await page.locator('input.custom-control').fill('9, 4, 6, 2');
		await page.getByRole('button', { name: '应用' }).click();
		await expect(page.getByRole('dialog', { name: /自定义/ })).toBeHidden();
		await expect(page.locator('.status-text')).toContainText('9 4 6 2');

		await page.locator('.title-btn', { hasText: '自定义' }).click();
		await page.locator('input.custom-control').fill('abc');
		await page.getByRole('button', { name: '应用' }).click();
		await expect(page.getByRole('dialog', { name: /自定义/ })).toBeVisible();
		await expect(page.locator('.custom-error')).toContainText('不是有效数字');
	});
});

test.describe('练习模式', () => {
	test('到达题目步骤弹题，答对得掌握度并可继续', async ({ page }) => {
		await openBubbleSort(page);
		await page.getByRole('tab', { name: '练习' }).click();

		await clickNext(page);
		await expect(page.locator('.current-num')).toHaveText('02');
		await settleTween(page);
		await clickNext(page);

		const dialog = page.getByRole('dialog', { name: '练习题目' });
		await expect(dialog).toBeVisible();
		await expect(dialog.locator('.question-title')).toContainText('最大的元素会出现在哪里');

		await dialog.locator('.option', { hasText: '数组末尾' }).click();
		await dialog.getByRole('button', { name: '提交答案' }).click();
		await expect(dialog.locator('.feedback')).toContainText('回答正确');

		await dialog.getByRole('button', { name: '继续下一步' }).click();
		await expect(dialog).toBeHidden();
	});

	test('答错记录错题并显示正确答案', async ({ page }) => {
		await openBubbleSort(page);
		await page.getByRole('tab', { name: '练习' }).click();

		await clickNext(page);
		await expect(page.locator('.current-num')).toHaveText('02');
		await settleTween(page);
		await clickNext(page);

		const dialog = page.getByRole('dialog', { name: '练习题目' });
		await expect(dialog).toBeVisible();
		await dialog.locator('.option', { hasText: '数组开头' }).click();
		await dialog.getByRole('button', { name: '提交答案' }).click();
		await expect(dialog.locator('.feedback')).toContainText('回答错误');
		await expect(dialog.locator('.correct-answer')).toContainText('数组末尾');
	});
});

test.describe('投影模式', () => {
	test('进入投影显示旁白，Esc 退出', async ({ page }) => {
		await openBubbleSort(page);
		await page.getByRole('button', { name: '投影' }).click();
		const projector = page.locator('.projector');
		await expect(projector).toBeVisible();
		await expect(projector.locator('.pj-narration')).toContainText('冒泡排序的思路');
		await expect(projector.locator('.pj-num')).toHaveText('01');

		await page.keyboard.press('ArrowRight');
		await expect(projector.locator('.pj-num')).toHaveText('02');

		await page.keyboard.press('Escape');
		await expect(projector).toBeHidden();
	});
});

test.describe('主题与导航', () => {
	test('暗色主题切换：html.dark 与 theme-color 同步', async ({ page }) => {
		await page.goto('/');
		await waitForHydratedGlobal(page);
		await expect(page.locator('html')).not.toHaveClass(/dark/);
		await page.getByRole('button', { name: '切换到暗色主题' }).click();
		await expect(page.locator('html')).toHaveClass(/dark/);
		await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#161514');
		await page.getByRole('button', { name: '切换到亮色主题' }).click();
		await expect(page.locator('html')).not.toHaveClass(/dark/);
	});

	test('侧边栏导航与跳转链接', async ({ page }) => {
		await page.goto('/');
		await waitForHydratedGlobal(page);
		await page.getByRole('button', { name: '显示导航' }).click();
		const nav = page.getByRole('navigation', { name: '课程目录' });
		await nav.getByText('快速排序').click();
		await expect(page.getByRole('heading', { name: '快速排序' })).toBeVisible();
		await expect(page.locator('.canvas-title')).toHaveText('快速排序');

		await page.goto('/');
		await waitForHydratedGlobal(page);
		await page.getByRole('button', { name: '显示导航' }).click();
		await page.getByRole('navigation', { name: '课程目录' }).getByText('图的遍历').click();
		await expect(page.getByRole('heading', { name: '图的遍历' })).toBeVisible();
	});

	test('进度页：空状态与学习记录入口', async ({ page }) => {
		await page.goto('/struct/progress');
		await waitForHydratedGlobal(page);
		await expect(page.getByRole('heading', { name: '你的学习进度' })).toBeVisible();
		await expect(page.getByText('还没有学习记录')).toBeVisible();
		await page.locator('main').getByRole('link', { name: '快速排序' }).click();
		await expect(page.getByRole('heading', { name: '快速排序' })).toBeVisible();
	});
});

test.describe('搜索', () => {
	test('搜索弹窗：按钮打开、关键词过滤、Enter 跳转、Esc 关闭', async ({ page }) => {
		await page.goto('/');
		await waitForHydratedGlobal(page);

		await page.getByRole('button', { name: '搜索课程' }).click();
		const dialog = page.getByRole('dialog', { name: '搜索课程' });
		await expect(dialog).toBeVisible();

		await dialog.getByRole('textbox', { name: '搜索关键词' }).fill('排序');
		await expect(dialog.getByText('快速排序')).toBeVisible();
		await expect(dialog.getByText('冒泡排序')).toBeVisible();
		await expect(dialog.getByText('二叉树遍历')).toBeHidden();

		await dialog.getByRole('textbox', { name: '搜索关键词' }).press('Enter');
		await expect(page.getByRole('heading', { name: '快速排序' })).toBeVisible();
	});

	test('搜索无结果提示与 / 快捷键打开', async ({ page }) => {
		await page.goto('/');
		await waitForHydratedGlobal(page);

		await page.keyboard.press('/');
		const dialog = page.getByRole('dialog', { name: '搜索课程' });
		await expect(dialog).toBeVisible();

		await dialog.getByRole('textbox', { name: '搜索关键词' }).fill('不存在的课程xyz');
		await expect(dialog.getByText(/没有找到/)).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
	});
});

test.describe('数据库 · 概述', () => {
	test('概述页：概念区块渲染、练习作答即时反馈', async ({ page }) => {
		await page.goto('/struct/db/overview');
		await expect(page.getByRole('heading', { name: '数据库系统概述' })).toBeVisible();
		await waitForHydratedGlobal(page);
		await expect(page.getByText('数据模型', { exact: true })).toBeVisible();
		await expect(page.getByText('三级模式结构', { exact: true })).toBeVisible();
		await expect(page.getByText('数据库管理系统（DBMS）', { exact: true })).toBeVisible();

		await page.locator('.quiz-item').first().getByRole('button', { name: /元组/ }).click();
		await expect(
			page.locator('.quiz-item').first().getByText('正确', { exact: true })
		).toBeVisible();
		await expect(page.locator('.quiz-explanation').first()).toBeVisible();

		const wrong = page
			.locator('.quiz-item')
			.nth(1)
			.getByRole('button', { name: /物理文件/ });
		await wrong.click();
		await expect(
			page.locator('.quiz-item').nth(1).getByText('错误', { exact: true })
		).toBeVisible();
	});
});

test.describe('数据库 · 高级查询', () => {
	test('高级查询页：播放器渲染、演示数据切换四种子句、搜索可定位', async ({ page }) => {
		await page.goto('/struct/db/advanced-query');
		await expect(page.getByRole('heading', { name: '高级查询' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await expect(page.locator('.canvas-title')).toHaveText('高级查询');
		await expect(page.locator('.pseudocode .line')).toHaveCount(5);
		await waitForHydrated(page);

		await page.locator('.title-btn', { hasText: '演示数据' }).click();
		await expect(page.getByRole('dialog', { name: '演示数据' })).toBeVisible();
		await page.locator('.preset-item', { hasText: '左连接保留全部学生' }).click();
		await expect(page.getByRole('dialog', { name: '演示数据' })).toBeHidden();
		await expect(page.locator('.title-btn', { hasText: '左连接保留全部学生' })).toContainText(
			'左连接保留全部学生'
		);
	});

	test('高级查询页：HAVING 预设逐步执行至完成', async ({ page }) => {
		await page.goto('/struct/db/advanced-query');
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await page.keyboard.press('Home');
		await expect(page.locator('.current-num')).toHaveText('01');

		await page.getByTitle('下一步 (→)').click();
		await expect(page.locator('.current-num')).toHaveText('02');
		for (let i = 0; i < 40; i++) {
			const status = await page.locator('.status-text').textContent();
			if (status?.includes('查询完成')) break;
			await page.getByTitle('下一步 (→)').click();
			await page.waitForTimeout(250);
		}
		await expect(page.locator('.status-text')).toContainText('查询完成');
	});

	test('高级查询页：练习模式弹题', async ({ page }) => {
		await page.goto('/struct/db/advanced-query');
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await page.keyboard.press('Home');
		await expect(page.locator('.current-num')).toHaveText('01');

		await page.getByRole('tab', { name: '练习' }).click();
		await page.getByTitle('下一步 (→)').click();
		await expect(page.locator('.current-num')).toHaveText('02');

		const dialog = page.getByRole('dialog', { name: '练习题目' });
		await expect(dialog).toBeVisible();
		await expect(dialog.locator('.question-title')).toContainText('WHERE 与 HAVING 的过滤时机');
		await dialog.locator('.option', { hasText: 'WHERE 筛行，HAVING 筛分组' }).click();
		await dialog.getByRole('button', { name: '提交答案' }).click();
		await expect(dialog.locator('.feedback')).toContainText('回答正确');
	});
});

test.describe('数据库 · 事务与权限', () => {
	test('事务页：播放器渲染、演示数据切换、逐步到回滚结论', async ({ page }) => {
		await page.goto('/struct/db/transaction');
		await expect(page.getByRole('heading', { name: '事务与并发控制' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await expect(page.locator('.canvas-title')).toHaveText('事务与并发控制');
		await waitForHydrated(page);

		await page.locator('.title-btn', { hasText: '演示数据' }).click();
		await expect(page.getByRole('dialog', { name: '演示数据' })).toBeVisible();
		await page.locator('.preset-item', { hasText: '转账失败回滚' }).click();
		await expect(page.getByRole('dialog', { name: '演示数据' })).toBeHidden();
		await expect(page.locator('.title-btn', { hasText: '转账失败回滚' })).toContainText(
			'转账失败回滚'
		);

		await page.keyboard.press('Home');
		await expect(page.locator('.current-num')).toHaveText('01');
		for (let i = 0; i < 40; i++) {
			const status = await page.locator('.status-text').textContent();
			if (status?.includes('回滚完成')) break;
			await page.getByTitle('下一步 (→)').click();
			await page.waitForTimeout(250);
		}
		await expect(page.locator('.status-text')).toContainText('回滚完成');
	});

	test('用户权限页：概念区块渲染、练习作答即时反馈', async ({ page }) => {
		await page.goto('/struct/db/users');
		await expect(page.getByRole('heading', { name: '用户与权限管理' })).toBeVisible();
		await waitForHydratedGlobal(page);
		await expect(page.locator('.concept-card h2', { hasText: '用户管理' })).toBeVisible();
		await expect(page.getByText('权限管理 GRANT / REVOKE', { exact: true })).toBeVisible();

		await page
			.locator('.quiz-item')
			.first()
			.getByRole('button', { name: /GRANT SELECT/ })
			.click();
		await expect(
			page.locator('.quiz-item').first().getByText('正确', { exact: true })
		).toBeVisible();
		await expect(page.locator('.quiz-explanation').first()).toBeVisible();
	});
});

test.describe('数据库 · 视图', () => {
	test('视图页：播放器渲染、演示数据切换、搜索可定位', async ({ page }) => {
		await page.goto('/struct/db/view');
		await expect(page.getByRole('heading', { name: '视图创建与使用' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await expect(page.locator('.canvas-title')).toHaveText('视图创建与使用');
		await expect(page.locator('.pseudocode .line')).toHaveCount(5);
		await waitForHydrated(page);

		await page.locator('.title-btn', { hasText: '演示数据' }).click();
		await expect(page.getByRole('dialog', { name: '演示数据' })).toBeVisible();
		await page.locator('.preset-item', { hasText: '连接视图' }).click();
		await expect(page.getByRole('dialog', { name: '演示数据' })).toBeHidden();
		await expect(page.locator('.title-btn', { hasText: '连接视图' })).toContainText('连接视图');
	});

	test('视图页：练习模式弹题', async ({ page }) => {
		await page.goto('/struct/db/view');
		await expect(page.getByRole('heading', { name: '视图创建与使用' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await page.keyboard.press('Home');
		await expect(page.locator('.current-num')).toHaveText('01');

		await page.getByRole('tab', { name: '练习' }).click();
		await page.getByTitle('下一步 (→)').click();
		await expect(page.locator('.current-num')).toHaveText('02');

		const dialog = page.getByRole('dialog', { name: '练习题目' });
		await expect(dialog).toBeVisible();
		await expect(dialog.locator('.question-title')).toContainText(
			'视图（VIEW）在数据库中保存的是什么'
		);
		await dialog.locator('.option', { hasText: '一条 SELECT 查询定义' }).click();
		await dialog.getByRole('button', { name: '提交答案' }).click();
		await expect(dialog.locator('.feedback')).toContainText('回答正确');
	});
});

test.describe('设置', () => {
	test('设置页：渲染三项设置并切换主题', async ({ page }) => {
		await page.goto('/struct/settings');
		await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();
		await expect(page.getByText('动画速度')).toBeVisible();
		await expect(page.getByText('显示提示')).toBeVisible();
		await expect(page.locator('.setting-label', { hasText: '主题' })).toBeVisible();

		const before = await page.locator('html').getAttribute('class');
		await page
			.locator('.page')
			.getByRole('button', { name: /切换到.*主题/ })
			.click();
		await expect(page.locator('html').getAttribute('class')).not.toBe(before);
	});
});

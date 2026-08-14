import { test, expect, type Page } from '@playwright/test';

// 全站粒子背景（three.js WebGL）在无 GPU 的 headless 环境走软件渲染，拖慢每个页面。
// 测试前注入禁用标志，让 Scene3D 静默跳过（功能断言不受影响）。
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		(window as unknown as Record<string, unknown>).__DSH_NO_SCENE__ = true;
	});
});

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

// 等待播放器当前步骤的控制 tween 播完（AlgoPlayer 在 canvas-body 上暴露
// data-tween-busy 信号），使 playbackPos 与步骤号对齐，否则连续步进时
// floor(playbackPos)+1 仍指向旧步骤。轮询替代固定 sleep，与动画时长解耦。
async function settleTween(page: Page) {
	await expect(page.locator('.canvas-body')).toHaveAttribute('data-tween-busy', 'false', {
		timeout: 5000
	});
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
	test('首页：标题、口号与课程入口', async ({ page }) => {
		await page.goto('/');
		await waitForHydratedGlobal(page);
		await expect(page.getByRole('heading', { name: /StructVis/ })).toBeVisible();
		await expect(page.getByText('看见数据结构与数据库的每一步跳动')).toBeVisible();
		await expect(page.getByText('进入课程目录')).toBeVisible();
		await expect(page.getByText('数据结构与算法', { exact: true })).toBeVisible();
		await expect(page.getByText('MySQL 数据库', { exact: true })).toBeVisible();
	});

	test('课程目录页：两门课程区块', async ({ page }) => {
		await page.goto('/struct/catalog');
		await waitForHydratedGlobal(page);
		await expect(page.getByRole('heading', { name: /课程目录/ })).toBeVisible();
		await expect(page.getByRole('heading', { name: '数据结构与算法' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'MySQL 数据库' })).toBeVisible();
		const main = page.locator('main');
		await expect(main.getByRole('link', { name: /快速排序/ })).toBeVisible();
		await expect(main.getByRole('link', { name: /数据查询/ })).toBeVisible();
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

	test('答错后进度页出现错题，可重新作答并标记已掌握', async ({ page }) => {
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
		await dialog.getByRole('button', { name: '继续下一步' }).click();

		// 进度页：错题记录 + 待复习标记
		await page.goto('/struct/progress');
		await waitForHydratedGlobal(page);
		const mistakeRow = page.locator('.mistake-row').first();
		await expect(mistakeRow).toContainText('冒泡排序');
		await expect(mistakeRow).toContainText('待复习');

		// 重新作答：再次答错，复习次数累计；答对则标记已掌握
		await mistakeRow.getByRole('button', { name: '重新作答' }).click();
		const reviewDialog = page.getByRole('dialog', { name: '练习题目' });
		await expect(reviewDialog).toBeVisible();
		await reviewDialog.locator('.option', { hasText: '数组末尾' }).click();
		await reviewDialog.getByRole('button', { name: '提交答案' }).click();
		await expect(reviewDialog.locator('.feedback')).toContainText('回答正确');
		await reviewDialog.getByRole('button', { name: '继续下一步' }).click();
		await expect(reviewDialog).toBeHidden();
		await expect(mistakeRow).toContainText('已掌握');
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
		await page.goto('/struct/ds/binary-tree');
		await waitForHydratedGlobal(page);
		await page.getByRole('button', { name: '显示导航' }).click();
		const nav = page.getByRole('navigation', { name: '课程目录' });
		await nav.getByText('快速排序').click();
		await expect(page.getByRole('heading', { name: '快速排序' })).toBeVisible();
		await expect(page.locator('.canvas-title')).toHaveText('快速排序');

		await page.goto('/struct/ds/binary-tree');
		await waitForHydratedGlobal(page);
		await page.getByRole('button', { name: '显示导航' }).click();
		await page.getByRole('navigation', { name: '课程目录' }).getByText('图的遍历').click();
		await expect(page.getByRole('heading', { name: '图的遍历' })).toBeVisible();
	});

	test('侧边栏分组跟随页面：数据库页显示数据库分组而非数据结构', async ({ page }) => {
		await page.goto('/struct/db/sql');
		await waitForHydratedGlobal(page);
		await page.getByRole('button', { name: '显示导航' }).click();
		const nav = page.getByRole('navigation', { name: '课程目录' });

		// 应显示数据库分组（基础/进阶/设计/运维）
		await expect(nav.getByText('基础')).toBeVisible();
		await expect(nav.getByText('数据查询')).toBeVisible();
		await expect(nav.getByText('进阶')).toBeVisible();
		// 不应显示数据结构分组
		await expect(nav.getByText('线性结构')).toBeHidden();
		await expect(nav.getByText('排序算法')).toBeHidden();

		// 当前项高亮（数据查询所在链接带 accent 左边框）
		const activeLink = nav.locator('a', { hasText: '数据查询' });
		await expect(activeLink).toHaveCSS('border-left-color', 'rgb(217, 119, 6)');

		// 回到数据结构页应恢复数据结构分组
		await page.goto('/struct/ds/quick-sort');
		await waitForHydratedGlobal(page);
		await page.getByRole('button', { name: '显示导航' }).click();
		const nav2 = page.getByRole('navigation', { name: '课程目录' });
		await expect(nav2.getByText('排序算法')).toBeVisible();
		await expect(nav2.getByText('基础')).toBeHidden();
	});

	test('移动端：侧栏以抽屉呈现，遮罩可关闭', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/struct/ds/bubble-sort');
		await waitForHydratedGlobal(page);
		const nav = page.getByRole('navigation', { name: '课程目录' });
		await expect(nav).toBeHidden();

		await page.getByRole('button', { name: '显示导航' }).click();
		await expect(nav).toBeVisible();
		await expect(page.locator('.drawer-backdrop')).toBeVisible();
		await expect(nav.getByRole('button', { name: '关闭导航' })).toBeVisible();

		await nav.getByRole('button', { name: '关闭导航' }).click();
		await expect(nav).toBeHidden();

		// 重新打开后通过遮罩关闭
		await page.getByRole('button', { name: '显示导航' }).click();
		await expect(nav).toBeVisible();
		await page.locator('.drawer-backdrop').click({ position: { x: 340, y: 400 } });
		await expect(nav).toBeHidden();
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

		// 输入框已按 ARIA combobox 模式标记（含 aria-activedescendant/aria-controls）
		await dialog.getByRole('combobox', { name: '搜索关键词' }).fill('排序');
		await expect(dialog.getByText('快速排序')).toBeVisible();
		await expect(dialog.getByText('冒泡排序')).toBeVisible();
		await expect(dialog.getByText('二叉树遍历')).toBeHidden();

		await dialog.getByRole('combobox', { name: '搜索关键词' }).press('Enter');
		await expect(page.getByRole('heading', { name: '快速排序' })).toBeVisible();
	});

	test('搜索无结果提示与 / 快捷键打开', async ({ page }) => {
		await page.goto('/');
		await waitForHydratedGlobal(page);

		await page.keyboard.press('/');
		const dialog = page.getByRole('dialog', { name: '搜索课程' });
		await expect(dialog).toBeVisible();

		await dialog.getByRole('combobox', { name: '搜索关键词' }).fill('不存在的课程xyz');
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

test.describe('回归与覆盖补充', () => {
	test('建表页：自定义解析成功后切回示例不崩溃（H1 回归）', async ({ page }) => {
		await page.goto('/struct/db/tables');
		await expect(page.getByRole('heading', { name: '建表练习' })).toBeVisible();
		await waitForHydratedGlobal(page);

		// 切到自定义视图，输入合法建表语句并解析
		await page.locator('.op-btn', { hasText: '自定义' }).click();
		await page
			.locator('textarea.custom-input')
			.fill('CREATE TABLE 测试 (id INT PRIMARY KEY, name VARCHAR(20))');
		await page.locator('.apply-btn', { hasText: '解析' }).click();
		await expect(page.locator('.schema-table')).toBeVisible();
		await expect(page.locator('.schema-name')).toContainText('测试');

		// 切回示例视图：此前 selectedPreset=-1 会导致 PRESETS[-1].sql 越界白屏
		await page.locator('.op-btn', { hasText: '示例' }).click();
		await expect(page.locator('.sql-block')).toBeVisible();
		await expect(page.locator('.schema-name')).toContainText('学生');
		// 页面未崩溃：标题仍可见
		await expect(page.getByRole('heading', { name: '建表练习' })).toBeVisible();
	});

	test('SQL 页：自定义 SQL 重建并逐步执行', async ({ page }) => {
		await page.goto('/struct/db/sql');
		await expect(page.getByRole('heading', { name: /数据查询/ })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);

		await page.locator('.title-btn', { hasText: '自定义' }).click();
		await page
			.locator('textarea.custom-control')
			.fill('SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 90');
		await page.getByRole('button', { name: '应用' }).click();
		await expect(page.getByRole('dialog', { name: /自定义/ })).toBeHidden();
		// 重建后回到第 0 步（FROM 扫描）
		await expect(page.locator('.status-text')).toContainText('FROM 学生');

		// 下一步 → WHERE 逐行判定（timeline 重建含 fade，用轮询等待可点击）
		await expect(async () => {
			await page.getByTitle('下一步 (→)').click();
			await expect(page.locator('.current-num').first()).toHaveText('02', { timeout: 1000 });
		}).toPass({ timeout: 10000 });
		await expect(page.locator('.status-text')).toContainText('WHERE');
		await page.keyboard.press('End');
		await expect(page.locator('.status-text')).toContainText('查询完成');
	});

	test('图的存储页：演示数据预设切换重建', async ({ page }) => {
		await page.goto('/struct/ds/graph-storage');
		await expect(page.getByRole('heading', { name: '图的存储' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);

		// 两个预设同为 5 顶点图、步数相同（8），故断言活动预设名与步数复位而非步数差异
		await page.locator('.title-btn', { hasText: '演示数据' }).click();
		await page.locator('.preset-item').nth(1).click();
		await expect(page.locator('.preset-item').first()).toBeHidden();
		// 重建后编号复位、活动预设按钮文案更新为所选预设
		await expect(page.locator('.current-num').first()).toHaveText('01');
		await expect(page.locator('.title-btn').first()).toContainText('邻接表');
	});
});

test.describe('覆盖补充：DB 播放器页', () => {
	test('数据更新页：渲染、步进、练习弹题（非冒泡页练习链路）', async ({ page }) => {
		await page.goto('/struct/db/update');
		await expect(page.getByRole('heading', { name: '数据更新' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);

		// 练习模式：第 2 步弹题（DmlEngine stepIndex 1）
		await page.getByRole('tab', { name: '练习' }).click();
		await clickNext(page);
		await expect(page.locator('.current-num')).toHaveText('02');

		const dialog = page.getByRole('dialog', { name: '练习题目' });
		await expect(dialog).toBeVisible();
		await expect(dialog.locator('.question-title')).toContainText('WHERE');
		await dialog.locator('.option').first().click();
		await dialog.getByRole('button', { name: '提交答案' }).click();
		await expect(dialog.locator('.feedback')).toBeVisible();
	});

	test('E-R 模型页：渲染与步进', async ({ page }) => {
		await page.goto('/struct/db/er');
		await expect(page.getByRole('heading', { name: 'E-R 模型' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await clickNext(page);
		await expect(page.locator('.current-num')).toHaveText('02');
		await page.keyboard.press('Home');
		await expect(page.locator('.current-num')).toHaveText('01');
	});

	test('索引原理页：渲染与步进', async ({ page }) => {
		await page.goto('/struct/db/index');
		await expect(page.getByRole('heading', { name: '索引原理' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await clickNext(page);
		await expect(page.locator('.current-num')).toHaveText('02');
		await page.keyboard.press('Home');
		await expect(page.locator('.current-num')).toHaveText('01');
	});

	test('关系规范化页：渲染与步进', async ({ page }) => {
		await page.goto('/struct/db/normalize');
		await expect(page.getByRole('heading', { name: '关系规范化' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await clickNext(page);
		await expect(page.locator('.current-num')).toHaveText('02');
		await page.keyboard.press('Home');
		await expect(page.locator('.current-num')).toHaveText('01');
	});

	test('进度页：导出备份可下载、导入备份可恢复', async ({ page }) => {
		await page.goto('/struct/progress');
		await expect(page.getByRole('heading', { name: '你的学习进度' })).toBeVisible();
		await waitForHydratedGlobal(page);

		// 导出：触发下载并读取文件内容
		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: '导出备份' }).click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toMatch(/^structvis-progress-.*.json$/);
		const stream = await download.createReadStream();
		const chunks: Buffer[] = [];
		for await (const c of stream) chunks.push(c as Buffer);
		const json = Buffer.concat(chunks).toString('utf-8');
		const parsed = JSON.parse(json) as { __sv: number; data: { topics: Record<string, unknown> } };
		expect(parsed.__sv).toBe(1);
		expect(typeof parsed.data.topics).toBe('object');

		// 导入：构造备份文件并上传
		const seed = JSON.stringify({
			__sv: 1,
			data: {
				topics: {
					'quick-sort': {
						mastery: 88,
						totalExercises: 9,
						correctExercises: 8,
						lastVisited: Date.now(),
						completed: true
					}
				},
				mistakes: [],
				totalStudyTime: 0,
				streakDays: 0,
				lastActiveDate: ''
			}
		});
		await page.locator('input[type="file"]').setInputFiles({
			name: 'backup.json',
			mimeType: 'application/json',
			buffer: Buffer.from(seed, 'utf-8')
		});
		await expect(page.getByText('导入成功，学习进度已恢复。')).toBeVisible();
		// 掌握度卡片反映导入数据
		await expect(page.getByText(/1 \/ \d+ 个主题已掌握/)).toBeVisible();
	});
});

// 截图基线在本地 Windows 生成（文件名带 -win32 后缀），CI（Linux）无对应基线且字体渲染差异大，故跳过。
// 如需 CI 截图回归：在 Linux 环境生成基线（npx playwright test -g "视觉回归" --update-snapshots）后移除本跳过。
test.describe('视觉回归（渲染器截图基线）', () => {
	test.skip(process.env.CI, '截图基线仅本地 Windows 生成（-win32 后缀），CI Linux 无匹配基线');
	// 截图基线生成：npx playwright test -g "视觉回归" --update-snapshots
	// 跨平台字体差异通过 maxDiffPixelRatio 容差吸收
	test('快速排序页画布截图基线', async ({ page }) => {
		await page.goto('/struct/ds/quick-sort');
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await expect(page.locator('.canvas-body canvas')).toBeVisible();
		// 等待页面入场动画完成（anime.js 驱动，animations: disabled 不覆盖）
		await expect(page.locator('.section-header')).toHaveCSS('opacity', '1');
		await expect(page.locator('.player-wrap')).toHaveCSS('opacity', '1');
		// 等待首帧绘制与字体稳定
		await expect(page.locator('.status-text')).toContainText('初始数组');
		// 粒子背景随机分布，截图前隐藏以保证基线可复现
		await page.locator('.scene3d').evaluate((el) => ((el as HTMLElement).style.display = 'none'));
		await expect(page.locator('.algo-player')).toHaveScreenshot('quick-sort-player.png', {
			animations: 'disabled',
			maxDiffPixelRatio: 0.05
		});
	});

	test('图的遍历页画布截图基线', async ({ page }) => {
		await page.goto('/struct/ds/graph-traversal');
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await expect(page.locator('.canvas-body canvas')).toBeVisible();
		// 等待页面入场动画完成
		await expect(page.locator('.section-header')).toHaveCSS('opacity', '1');
		await expect(page.locator('.player-wrap')).toHaveCSS('opacity', '1');
		// 粒子背景随机分布，截图前隐藏以保证基线可复现
		await page.locator('.scene3d').evaluate((el) => ((el as HTMLElement).style.display = 'none'));
		await expect(page.locator('.algo-player')).toHaveScreenshot('graph-traversal-player.png', {
			animations: 'disabled',
			maxDiffPixelRatio: 0.05
		});
	});

	test('二叉树遍历页画布截图基线', async ({ page }) => {
		await page.goto('/struct/ds/binary-tree');
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await expect(page.locator('.canvas-body canvas')).toBeVisible();
		// 等待页面入场动画完成
		await expect(page.locator('.section-header')).toHaveCSS('opacity', '1');
		await expect(page.locator('.player-wrap')).toHaveCSS('opacity', '1');
		// 粒子背景随机分布，截图前隐藏以保证基线可复现
		await page.locator('.scene3d').evaluate((el) => ((el as HTMLElement).style.display = 'none'));
		await expect(page.locator('.algo-player')).toHaveScreenshot('binary-tree-player.png', {
			animations: 'disabled',
			maxDiffPixelRatio: 0.05
		});
	});
});

test.describe('v2.0 讲授剧本', () => {
	test('导入自定义剧本后投影旁白生效，可恢复默认', async ({ page }) => {
		await openBubbleSort(page);

		// 打开剧本菜单并导入自定义 JSON
		await page.getByRole('button', { name: '剧本', exact: true }).click();
		const custom = JSON.stringify({
			version: 1,
			name: '自定义测试讲法',
			items: [
				{ type: 'init', narration: '自定义开场白：这是冒泡排序的输入数组。' },
				{ type: 'compare', narration: '自定义比较旁白。' },
				{ type: 'swap', narration: '自定义交换旁白。' },
				{ type: 'complete', narration: '自定义完成旁白。' }
			]
		});
		await page.locator('.script-menu input[type="file"]').setInputFiles({
			name: 'script.json',
			mimeType: 'application/json',
			buffer: Buffer.from(custom, 'utf-8')
		});
		await expect(page.locator('.script-msg')).toContainText('剧本导入成功');

		// 进入投影，第 1 步（init）应显示自定义开场白
		await page.getByRole('button', { name: '投影', exact: true }).click();
		await expect(page.locator('.pj-narration')).toContainText('自定义开场白');
		// 未在剧本中覆盖的步骤类型（recurse-enter）回落到步骤描述（fallback 正常）
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('.pj-narration')).toContainText('第 1 轮');
		// Esc 退出投影（fullscreenchange 同步）
		await page.keyboard.press('Escape');

		// 恢复默认剧本
		await page.getByRole('button', { name: '剧本', exact: true }).click();
		await page.getByRole('menuitem', { name: '恢复默认剧本' }).click();
		await expect(page.locator('.script-msg')).toContainText('已恢复引擎默认剧本');
		await page.getByRole('button', { name: '投影', exact: true }).click();
		// 恢复后不再显示自定义旁白（回落到引擎默认剧本）
		await expect(page.locator('.pj-narration')).not.toContainText('自定义开场白');
	});
});

test.describe('v2.0 移动端体验', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('竖屏：画布区在伪代码区上方且均可见', async ({ page }) => {
		await page.goto('/struct/ds/quick-sort');
		await expect(page.getByRole('heading', { name: '快速排序' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);

		const canvasBox = await page.locator('.canvas-area').boundingBox();
		const panelBox = await page.locator('.right-panel').boundingBox();
		expect(canvasBox).not.toBeNull();
		expect(panelBox).not.toBeNull();
		// 画布在上、伪代码在下（竖屏单列）
		expect(canvasBox!.y).toBeLessThan(panelBox!.y);
		// 画布高度占优
		expect(canvasBox!.height).toBeGreaterThan(panelBox!.height);
		// 投影模式在窄屏可进入（覆盖层即全屏）
		await page.getByRole('button', { name: '投影', exact: true }).click();
		await expect(page.locator('.projector')).toBeVisible();
		await expect(page.locator('.pj-narration')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('.projector')).toBeHidden();
	});
});

test.describe('v2.0 SQL 扩展', () => {
	test('窗口函数页：渲染、预设切换、逐步执行', async ({ page }) => {
		await page.goto('/struct/db/window-function');
		await expect(page.getByRole('heading', { name: '窗口函数' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await page.locator('.title-btn', { hasText: '演示数据' }).click();
		await page.locator('.preset-item', { hasText: '并列名次（RANK）' }).click();
		await expect(page.locator('.title-btn', { hasText: '并列名次' })).toContainText('RANK');
		// 预设重建含 fade，End 在重建完成前无效——轮询重试
		await expect(async () => {
			await page.keyboard.press('End');
			await expect(page.locator('.status-text')).toContainText('计算完成', { timeout: 1000 });
		}).toPass({ timeout: 10000 });
	});

	test('执行计划页：渲染、索引胜出预设、结论可见', async ({ page }) => {
		await page.goto('/struct/db/explain-plan');
		await expect(page.getByRole('heading', { name: '执行计划与索引选择' })).toBeVisible();
		await expect(page.locator('.algo-player')).toBeVisible();
		await waitForHydrated(page);
		await page.locator('.title-btn', { hasText: '演示数据' }).click();
		await page.locator('.preset-item', { hasText: '范围查询' }).click();
		await expect(async () => {
			await page.keyboard.press('End');
			await expect(page.locator('.status-text')).toContainText('索引查找', { timeout: 1000 });
		}).toPass({ timeout: 10000 });
	});
});

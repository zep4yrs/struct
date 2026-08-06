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

// 工作台新关卡端到端验证（dev server master 工作树）
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await p.goto('http://localhost:5199/struct/db/workbench/', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const counter = await p.evaluate(() => document.querySelector('.wb-passed')?.textContent);
console.log('关卡计数显示:', counter);

await p.locator('.level-item').first().click();
await p.waitForTimeout(800);
await p.evaluate(() => {
	const ta = document.querySelector('.sql-input');
	ta.value = "SELECT tracking_no, recipient_name FROM packages WHERE status = '待取件' ORDER BY arrival_time ASC";
	ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.locator('button', { hasText: '运行' }).click();
await p.waitForTimeout(1500);
const verdict = await p.evaluate(() => document.querySelector('.verdict')?.textContent?.trim());
console.log('关卡1 判分:', verdict);

const submitBtn = p.locator('button', { hasText: '提交判定' });
if (await submitBtn.isEnabled()) {
	await submitBtn.click();
	await p.waitForTimeout(1000);
	const passed = await p.evaluate(() => document.querySelector('.wb-passed')?.textContent);
	console.log('提交后计数:', passed);
} else {
	console.log('提交判定按钮不可用');
}
await b.close();

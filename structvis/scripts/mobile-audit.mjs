// 手机端全页面布局验收：横向溢出 / 底导遮挡 / 截断检测（375×812）
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const PAGES = [
	'/',
	'/home/',
	'/catalog/',
	'/ds/',
	'/ds/bubble-sort/',
	'/db/',
	'/db/sql/',
	'/db/tables/',
	'/db/workbench/',
	'/race/',
	'/map/',
	'/progress/',
	'/sprint/',
	'/quiz/',
	'/report/',
	'/settings/',
	'/about/'
];

mkdirSync('/tmp/mobile-audit', { recursive: true });
const results = [];

const b = await chromium.launch();
const ctx = await b.newContext({
	viewport: { width: 375, height: 812 },
	isMobile: true,
	hasTouch: true,
	deviceScaleFactor: 2
});
const p = await ctx.newPage();

for (const pg of PAGES) {
	const entry = { page: pg, issues: [] };
	try {
		await p.goto('http://localhost:5199/struct' + pg, { waitUntil: 'networkidle', timeout: 30000 });
	} catch {
		await p.goto('http://localhost:5199/struct' + pg, {
			waitUntil: 'domcontentloaded',
			timeout: 30000
		});
	}
	await p.waitForTimeout(2000);

	// ① 横向溢出：以真实可滚为准（html overflow-x: clip 下 scrollWidth 仍会上报内容宽，
	// 但用户滚不动；scrollTo 到底读 scrollX 才是用户可见真相）
	const hOverflow = await p.evaluate(() => {
		const d = document.documentElement;
		window.scrollTo(99999, 0);
		const scrolledX = window.scrollX;
		window.scrollTo(0, 0);
		return { scrollW: d.scrollWidth, clientW: d.clientWidth, overflow: scrolledX > 2 };
	});
	if (hOverflow.overflow) entry.issues.push(`横向溢出 ${hOverflow.scrollW}>${hOverflow.clientW}`);

	// ② 可见元素超出右界（视口内）。判真条件：元素是 fixed（不进滚动区、直接露在界外可见），
	// 或文档真实可滚（scrollWidth 超标）。否则视为被 overflow:hidden/clip 祖先裁住（如推挤轮播
	// 的非 on 态 translateX 预置位），用户不可见，不算违规。
	const offRight = await p.evaluate(() => {
		window.scrollTo(99999, 0);
		const docScrollable = window.scrollX > 2;
		window.scrollTo(0, 0);
		const out = [];
		for (const el of document.querySelectorAll('body *')) {
			const cs = getComputedStyle(el);
			if (cs.display === 'none' || cs.visibility === 'hidden') continue;
			const r = el.getBoundingClientRect();
			if (r.width > 20 && r.right > innerWidth + 2 && r.top >= 0 && r.top < innerHeight) {
				if (cs.position === 'fixed' || docScrollable) {
					out.push(
						(el.className || el.tagName).toString().slice(0, 30) + ' right=' + Math.round(r.right)
					);
				}
			}
		}
		return out.slice(0, 3);
	});
	if (offRight.length) entry.issues.push('右界超出: ' + offRight.join(';'));

	// ③ 滚到底：底导遮挡内容
	await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await p.waitForTimeout(400);
	const occl = await p.evaluate(() => {
		const nav = document.querySelector('.bottom-nav');
		if (!nav) return { nav: false };
		const navTop = nav.getBoundingClientRect().top;
		let worst = null;
		for (const el of document.querySelectorAll('main *')) {
			const cs = getComputedStyle(el);
			if (cs.position === 'fixed' || cs.display === 'none') continue;
			const r = el.getBoundingClientRect();
			if (r.height < 8) continue;
			// 底导带内的内容元素（被遮）
			if (r.bottom > navTop + 4 && r.top < navTop && !el.matches('.bottom-nav, .bottom-nav *')) {
				if (!worst || r.bottom > worst.bottom)
					worst = (el.className || el.tagName).toString().slice(0, 26);
			}
		}
		return { navTop: Math.round(navTop), blocked: worst };
	});
	if (occl.blocked) entry.issues.push(`底导遮挡: ${occl.blocked}`);

	// ④ 截图存档
	await p.evaluate(() => window.scrollTo(0, 0));
	await p.waitForTimeout(250);
	await p.screenshot({ path: `/tmp/mobile-audit/${pg.replace(/\//g, '_') || 'root'}.png` });

	const status = entry.issues.length ? 'FAIL' : 'PASS';
	console.log(status, pg, entry.issues.join(' | ') || '');
	results.push({ page: pg, status, issues: entry.issues });
}

await b.close();
console.log('=== SUMMARY ===');
const fail = results.filter((r) => r.status === 'FAIL');
console.log(
	`PASS ${results.length - fail.length}/${results.length}`,
	fail.length ? '| FAIL pages: ' + fail.map((f) => f.page).join(',') : '— 全部合格'
);

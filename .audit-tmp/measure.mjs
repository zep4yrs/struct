import { chromium } from 'file:///D:/fengqiao/Documents/%E9%A1%B9%E7%9B%AE%E7%BB%8F%E5%8E%86/DBVis/structvis/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:5173/struct';
const browser = await chromium.launch();

async function measure(path, width) {
	const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
	const page = await ctx.newPage();
	await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
	await page.waitForTimeout(800);
	const out = await page.evaluate(() => {
		const colsOf = (el) => {
			if (!el) return 0;
			return getComputedStyle(el).gridTemplateColumns.split(' ').length;
		};
		const rowsOf = (sel) => {
			const els = [...document.querySelectorAll(sel)];
			const tops = new Map();
			for (const el of els) {
				const t = Math.round(el.getBoundingClientRect().top);
				tops.set(t, (tops.get(t) ?? 0) + 1);
			}
			return { rows: tops.size, perRowMax: Math.max(0, ...tops.values()) };
		};
		const groups = [...document.querySelectorAll('.race-group-head .section-label')].map((e) =>
			e.textContent.trim()
		);
		return {
			topicGridCols: colsOf(document.querySelector('.grid.grid-cols-1')),
			catalogCards: rowsOf('.topic-card'),
			raceGridCols: colsOf(document.querySelector('.race-grid')),
			lanes: rowsOf('.race-lane'),
			groups,
			hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
		};
	});
	console.log(`${path} @${width}px → ` + JSON.stringify(out));
	await ctx.close();
}

await measure('/catalog', 1920);
await measure('/catalog', 1440);
await measure('/catalog', 1024);
await measure('/race', 1920);
await measure('/race', 1440);
await measure('/race', 1024);
await measure('/ds', 1920);

await browser.close();

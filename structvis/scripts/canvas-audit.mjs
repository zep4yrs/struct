// 全画布巡检：87 课题页 + sql/tables/workbench，双主题
// 探测：画布缺失/零尺寸、host 内意外横滚（桌面）、垂直裁剪、背存与显示失配（模糊）、
// 暗色下渲染器隐形（画布像素近单一色 = token 解析失败回退）
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const topics = readFileSync('src/lib/content/topics.ts', 'utf-8')
	.match(/href: '([^']+)'/g)
	.map((m) => m.slice(7, -1)); // "href: '/x'" → "/x"（7 字符前缀 href: ' ）
const extra = ['/db/sql/', '/db/tables/', '/db/workbench/'];
const PAGES = [...topics.map((h) => h + '/'), ...extra];

const results = [];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

// 画布像素直读：量化后统计主色占比（占比过高=空白/隐形）与颜色数
function probeExpr() {
	const c = document.querySelector('.canvas-host canvas');
	if (!c) return { none: true };
	const rect = c.getBoundingClientRect();
	if (rect.width < 4 || rect.height < 4) return { tiny: true, w: rect.width, h: rect.height };
	const host = c.parentElement;
	const hr = host.getBoundingClientRect();
	const scrollX = host.scrollWidth > host.clientWidth + 1;
	const clipY = rect.bottom > hr.bottom + 2 || rect.top < hr.top - 2;
	const dpr = window.devicePixelRatio || 1;
	const blur =
		Math.abs(c.width - rect.width * dpr) > 2 || Math.abs(c.height - rect.height * dpr) > 2;
	let colors = 0;
	let dominant = 1;
	let lumStd = 0;
	try {
		const g = c.getContext('2d');
		if (g) {
			const d = g.getImageData(0, 0, c.width, c.height).data;
			const seen = new Map();
			let total = 0;
			let sum = 0;
			let sum2 = 0;
			for (let i = 0; i < d.length; i += 64) {
				const key = (d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4);
				seen.set(key, (seen.get(key) ?? 0) + 1);
				const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
				sum += lum;
				sum2 += lum * lum;
				total++;
			}
			colors = seen.size;
			dominant = Math.max(...seen.values()) / total;
			const mean = sum / total;
			lumStd = Math.sqrt(Math.max(0, sum2 / total - mean * mean));
		}
	} catch {
		return { opaque: true, w: Math.round(rect.width), h: Math.round(rect.height) };
	}
	return {
		w: Math.round(rect.width),
		h: Math.round(rect.height),
		scrollX,
		clipY,
		blur,
		colors,
		dominant: Math.round(dominant * 1000) / 10,
		lumStd: Math.round(lumStd * 10) / 10
	};
}

const LIMIT = process.env.CA_LIMIT ? Number(process.env.CA_LIMIT) : PAGES.length;
for (const theme of ['light', 'dark']) {
	await ctx.addInitScript(
		([t]) => {
			localStorage.setItem('structvis:settings', JSON.stringify({ theme: t }));
		},
		[theme]
	);
	for (const pg of PAGES.slice(0, LIMIT)) {
		let entry = { page: pg, theme };
		try {
			await p.goto('http://localhost:5199/struct' + pg, {
				waitUntil: 'networkidle',
				timeout: 25000
			});
		} catch {
			await p.goto('http://localhost:5199/struct' + pg, {
				waitUntil: 'domcontentloaded',
				timeout: 25000
			});
		}
		await p.waitForTimeout(1100);
		entry.probe = await p.evaluate(probeExpr);
		results.push(entry);
		const f = entry.probe;
		const flag =
			f.none || f.tiny
				? 'MISSING'
				: f.opaque
					? 'OPAQUE'
					: f.colors <= 3 || f.dominant > 98
						? 'BLANK'
						: f.clipY || f.blur
							? 'GEOM'
							: f.scrollX
								? 'SCROLL'
								: '';
		if (flag) console.log(theme.padEnd(5), flag.padEnd(7), pg, JSON.stringify(f));
	}
}

await b.close();
writeFileSync('/tmp/canvas-audit.json', JSON.stringify(results, null, 1));
const bad = results.filter((r) => {
	const f = r.probe ?? {};
	return f.none || f.tiny || f.opaque || f.colors <= 3 || f.dominant > 98 || f.clipY || f.blur;
});
console.log('=== SUMMARY ===');
console.log(`pages=${PAGES.length}x2 flags=${bad.length}`);

// 公益广告位数据抓取：腾讯志愿者「404 计划」官方 CDN feed
// （volunteer.cdn-go.cn/404/latest/404.jsonp.js，公开机器可读、无反爬）
// 输出 static/ads/psa.json：过期专题过滤、宝贝回家优先、最多 5 条。
// 运行：node scripts/fetch-psa.mjs（可挂 GitHub Actions 每日定时）
import { writeFileSync, mkdirSync } from 'node:fs';

const FEED = 'https://volunteer.cdn-go.cn/404/latest/404.jsonp.js';
const IMG_BASE = 'https://volunteer.cdn-go.cn/404/latest/';

/** 专题元信息：cid 前缀 → tag/title/desc（与 BankSystem 版一致，宝贝回家 star 最前） */
const PSA_META = {
	baby: {
		tag: '寻亲',
		title: '宝贝回家 · 失踪宝贝信息传播计划',
		desc: '让每一个走失的宝贝被更多人看见',
		star: 1
	},
	freelunch: { tag: '暖餐', title: '免费午餐计划', desc: '帮助山区孩子吃上热腾腾的午餐', star: 0 },
	dream4school: { tag: '助学', title: '一校一梦想', desc: '支持乡村小学实现一个小小梦想', star: 0 },
	lamp: { tag: '乡村', title: '点亮乡村计划', desc: '为乡村孩子点亮一盏求知的灯', star: 0 },
	greenback: { tag: '环保', title: '绿色找回计划', desc: '闲置回收，让爱心循环', star: 0 },
	flood: { tag: '救灾', title: '洪水救援行动', desc: '帮助灾区孩子重回课堂', star: 0 }
};

const raw = await (await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
const today = new Date().toISOString().slice(0, 10);
const items = [];

for (const m of raw.matchAll(
	/\{\s*"name":"([^"]+)"[\s\S]*?id:"([^"]+)"[\s\S]*?expires:"([^"]+)"[\s\S]*?"pc":"([\s\S]*?)"\s*,\s*"mobile"/g
)) {
	const [, name, cid, expires, pc] = m;
	if (expires < today) continue; // 过期专题不展示
	const metaKey = Object.keys(PSA_META).find((k) => cid.startsWith(k));
	if (!metaKey) continue;
	const meta = PSA_META[metaKey];
	const linkM = reSearch(pc, /href=\\+"([^"\\]+)/);
	const link =
		linkM && /^https?:/i.test(linkM)
			? linkM
			: metaKey === 'baby'
				? 'https://www.baobeihuijia.com/'
				: 'https://www.qq.com/404/';
	const imgM = reSearch(pc, /path404[^"]*?"([^"\\]+\.(?:png|jpe?g))/i);
	const img = imgM ? IMG_BASE + imgM : '';
	items.push({
		id: cid,
		tag: meta.tag,
		title: meta.title,
		desc: meta.desc,
		link,
		img,
		star: meta.star
	});
}

function reSearch(text, re) {
	const m = text.match(re);
	return m ? m[1] : '';
}

items.sort((a, b) => b.star - a.star);
const seen = new Set();
const unique = items.filter((it) => {
	const sig = it.title + '|' + it.link;
	if (seen.has(sig)) return false;
	seen.add(sig);
	return true;
});
const top = unique.slice(0, 5);

mkdirSync(new URL('../static/ads/', import.meta.url), { recursive: true });
writeFileSync(
	new URL('../static/ads/psa.json', import.meta.url),
	JSON.stringify({ source: '腾讯志愿者 404 计划', updatedAt: today, items: top }, null, 2)
);
console.log(`psa.json: ${top.length} 条（宝贝回家优先）`, top.map((i) => i.tag).join('/'));

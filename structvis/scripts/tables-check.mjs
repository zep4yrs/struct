// 补测：从当前 SPA 状态 → catalog → 切 SQL 实验分段 → /db/tables 卡片
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const meta = list.find((t) => t.type === 'page');
const ws = new WebSocket(meta.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pend = new Map();
ws.onmessage = (ev) => {
	const m = JSON.parse(ev.data);
	if (m.id && pend.has(m.id)) {
		pend.get(m.id)(m);
		pend.delete(m.id);
	}
};
const send = (method, params = {}) => {
	const id = ++seq;
	ws.send(JSON.stringify({ id, method, params }));
	return new Promise((r) => pend.set(id, r));
};
const ev = async (expression) => {
	const r = await send('Runtime.evaluate', { expression, returnByValue: true });
	return r.result?.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await ev(
	`(() => { const a = document.querySelector('a[href="/catalog"]'); if (a) { a.click(); return 'OK'; } return 'NO'; })()`
);
await sleep(1800);
await ev(
	`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('MySQL 课程')); if (b) b.click(); return 'ok'; })()`
);
await sleep(1500);
const segState = await ev(
	`(() => { const chips = [...document.querySelectorAll('.seg-chip')].map((c) => c.textContent.trim()); const hrefs = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href')).filter((h) => h && h.includes('/db/')); return JSON.stringify({ chips, dbHrefs: [...new Set(hrefs)].slice(0, 8) }); })()`
);
console.log('seg state:', segState);
const clicked = await ev(
	`(() => { const a = document.querySelector('a[href="/db/tables"]'); if (a) { a.click(); return 'OK'; } return 'NO'; })()`
);
await sleep(2500);
const at = await ev('location.pathname');
const h1 = await ev('(document.querySelector("h1") ?? {}).textContent ?? ""');
console.log('click:', clicked, '| at:', at, '| h1:', h1);
const shot = await send('Page.captureScreenshot', { format: 'png' });
const { writeFileSync } = await import('node:fs');
writeFileSync('D:/tmp/sweep3-light-_db_tables_.png', Buffer.from(shot.result.data, 'base64'));
ws.close();

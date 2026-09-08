// CDP 驱动 SQL 工作台：注入有效 SQL → 运行 → 读结果面板（夜间巡检用）
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

const sql = 'SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85 ORDER BY 成绩 DESC';
const inject = `(() => {
	const ta = document.querySelector('.sql-input');
	if (!ta) return 'NO_TEXTAREA';
	ta.value = ${JSON.stringify(sql)};
	ta.dispatchEvent(new Event('input', { bubbles: true }));
	return 'OK';
})()`;
const r1 = await send('Runtime.evaluate', { expression: inject, returnByValue: true });
console.log('inject:', r1.result?.result?.value);
await new Promise((r) => setTimeout(r, 300));

const r2 = await send('Runtime.evaluate', {
	expression: `(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('运行')); if (!b) return 'NO_BTN'; b.click(); return 'CLICKED'; })()`,
	returnByValue: true
});
console.log('run click:', r2.result?.result?.value);
await new Promise((r) => setTimeout(r, 2500));

const r3 = await send('Runtime.evaluate', {
	expression: `JSON.stringify({
		rows: document.querySelectorAll('.result-table tbody tr').length,
		err: (document.querySelector('.sql-error')?.textContent ?? '').slice(0, 80),
		head: [...document.querySelectorAll('.result-table th')].map((h) => h.textContent).join(',')
	})`,
	returnByValue: true
});
console.log('RESULT:', r3.result?.result?.value);

const shot = await send('Page.captureScreenshot', { format: 'png' });
const { writeFileSync } = await import('node:fs');
writeFileSync('D:/tmp/emu-wb7.png', Buffer.from(shot.result.data, 'base64'));
ws.close();

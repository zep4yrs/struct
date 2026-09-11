// APK 关卡 1 判分诊断 v2：回读注入值 + 按钮命中 + 长等待
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

const SQL = "SELECT tracking_no, recipient_name FROM packages WHERE status = '待取件' ORDER BY arrival_time ASC";

// 确保在工作台页
const at = await ev('location.pathname');
console.log('at:', at);
if (!at.includes('workbench')) {
	await ev(
		`(() => { const b = [...document.querySelectorAll('button, a')].find((x) => x.textContent.includes('进入课程目录')); if (b) b.click(); return 'ok'; })()`
	);
	await sleep(2000);
	await ev(
		`(() => { const a = [...document.querySelectorAll('a')].find((x) => x.textContent.trim() === 'SQL 工作台'); if (a) a.click(); return 'ok'; })()`
	);
	await sleep(2500);
}

// 选中关卡 1（若已选中则跳过）
await ev(
	`(() => { const lv = [...document.querySelectorAll('.level-item')].find((x) => x.textContent.includes('待取件看板')); if (lv) lv.click(); return 'ok'; })()`
);
await sleep(1500);

// 注入并回读
const back = await ev(
	`(() => {
		const ta = document.querySelector('.sql-input');
		if (!ta) return 'NO_TA';
		ta.value = ${JSON.stringify(SQL)};
		ta.dispatchEvent(new Event('input', { bubbles: true }));
		return ta.value.slice(0, 40);
	})()`
);
console.log('注入回读:', back);

// 点运行（按钮文本精确匹配 ▶ 运行）
const btnHit = await ev(
	`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.replace(/\\s/g, '').includes('运行')); if (!b) return 'NO_BTN'; b.click(); return 'CLICKED'; })()`
);
console.log('运行按钮:', btnHit);
await sleep(3500);

const diag = await ev(
	`JSON.stringify({
		verdict: (document.querySelector('.verdict')?.textContent ?? 'NO_VERDICT_EL').slice(0, 80),
		verdictOk: document.querySelector('.verdict')?.classList?.contains('ok') ?? null,
		resultRows: document.querySelectorAll('.result-table tbody tr').length,
		resultHead: [...document.querySelectorAll('.result-table th')].map((h) => h.textContent).join(',')
	})`
);
console.log('诊断:', diag);
const shot = await send('Page.captureScreenshot', { format: 'png' });
const { writeFileSync } = await import('node:fs');
writeFileSync('D:/tmp/night-apk-l1b.png', Buffer.from(shot.result.data, 'base64'));
ws.close();

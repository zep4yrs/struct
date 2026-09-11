// APK：点提交判定 → 读过关计数 → 截图
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
const out = await ev(
	`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('提交判定')); if (!b) return 'NO_BTN'; if (b.disabled) return 'DISABLED'; b.click(); return 'CLICKED'; })()`
);
await new Promise((r) => setTimeout(r, 1800));
const passed = await ev(`document.querySelector('.wb-passed')?.textContent ?? 'NONE'`);
const verdict = await ev(`(document.querySelector('.verdict')?.textContent ?? 'NO_EL').slice(0, 80)`);
console.log('提交判定:', out, '| 过关计数:', passed, '| verdict:', verdict);
const shot = await send('Page.captureScreenshot', { format: 'png' });
const { writeFileSync } = await import('node:fs');
writeFileSync('D:/tmp/night-apk-submit.png', Buffer.from(shot.result.data, 'base64'));
ws.close();

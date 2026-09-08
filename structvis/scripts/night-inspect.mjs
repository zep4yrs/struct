// 深夜巡检：经 CDP 驱动 APK WebView 逐页导航/截图/收集运行时错误（page 级协议，无依赖）
import { writeFileSync } from 'node:fs';

const CDP_HTTP = 'http://127.0.0.1:9222';
const list = await (await fetch(CDP_HTTP + '/json/list')).json();
const pageMeta = list.find((t) => t.type === 'page');
if (!pageMeta) {
	console.error('NO_PAGE_TARGET');
	process.exit(1);
}

const ws = new WebSocket(pageMeta.webSocketDebuggerUrl);
await new Promise((res, rej) => {
	ws.onopen = res;
	ws.onerror = (e) => rej(new Error('ws error'));
});

let seq = 0;
const pending = new Map();
const jsErrors = [];
ws.onmessage = (ev) => {
	const msg = JSON.parse(ev.data);
	if (msg.id && pending.has(msg.id)) {
		pending.get(msg.id)(msg);
		pending.delete(msg.id);
	}
	if (msg.method === 'Runtime.exceptionThrown') {
		jsErrors.push(String(msg.params?.exceptionDetails?.exception?.description ?? msg.params?.exceptionDetails?.text ?? '').slice(0, 140));
	}
	if (msg.method === 'Log.entryAdded' && msg.params?.entry?.level === 'error') {
		jsErrors.push('LOG: ' + String(msg.params.entry.text).slice(0, 140));
	}
};

function send(method, params = {}) {
	const id = ++seq;
	ws.send(JSON.stringify({ id, method, params }));
	return new Promise((res) => pending.set(id, res));
}

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');

const shots = [
	['/db/sql/', 'sql'],
	['/quiz/', 'quiz'],
	['/race/', 'race'],
	['/sprint/', 'sprint'],
	['/home/', 'home']
];

for (const [route, name] of shots) {
	await send('Page.navigate', { url: 'https://localhost' + route });
	await new Promise((r) => setTimeout(r, 2800));
	const { result: t } = await send('Runtime.evaluate', { expression: 'document.title + " | " + (document.querySelector("h1")?.textContent ?? "").slice(0, 24)', returnByValue: true });
	const shot = await send('Page.captureScreenshot', { format: 'png' });
	if (shot.result?.data) writeFileSync(`D:/tmp/night-${name}.png`, Buffer.from(shot.result.data, 'base64'));
	console.log(name, '→', t?.result?.value ?? '(no title)');
}

console.log('JS_ERRORS:', jsErrors.length ? JSON.stringify(jsErrors.slice(0, 10), null, 1) : 'none');
ws.close();

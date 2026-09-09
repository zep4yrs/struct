// APK WebView 全页面巡检 v3：CDP + SPA 点击驱动，路径按真实 href 图谱规划
// 用法：node scripts/apk-sweep.mjs [light|dark]（需先 adb forward tcp:9222 webview socket）
const THEME = process.argv[2] === 'dark' ? 'dark' : 'light';
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const meta = list.find((t) => t.type === 'page');
if (!meta) {
	console.error('NO_PAGE');
	process.exit(1);
}
const ws = new WebSocket(meta.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pend = new Map();
const errors = [];
ws.onmessage = (ev) => {
	const m = JSON.parse(ev.data);
	if (m.id && pend.has(m.id)) {
		pend.get(m.id)(m);
		pend.delete(m.id);
	}
	if (m.method === 'Runtime.exceptionThrown') {
		errors.push(String(m.params?.exceptionDetails?.exception?.description ?? '').slice(0, 120));
	}
};
const send = (method, params = {}) => {
	const id = ++seq;
	ws.send(JSON.stringify({ id, method, params }));
	return new Promise((r) => pend.set(id, r));
};
const evalJs = async (expression) => {
	const r = await send('Runtime.evaluate', { expression, returnByValue: true });
	return r.result?.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable');
await send('Runtime.enable');
await evalJs(`localStorage.setItem('structvis:settings', JSON.stringify({ theme: '${THEME}' })); 'ok'`);
await send('Page.navigate', { url: 'https://localhost/' });
await sleep(2600);

// [路由, 到达方式]：{sel}=点击选择器（sec-item=课题页二级条）；{back:n}=历史回退
const steps = [
	['/catalog/', { sel: 'a[href="/catalog"]' }],
	['/map/', { sel: 'a[href="/map"]' }],
	['/race/', { sel: '.sec-item[href="/race"], a[href="/race"]' }],
	['/db/workbench/', { sel: '.sec-item[href="/db/workbench"], a[href="/db/workbench"]' }],
	['/race/', { back: 1 }],
	['/map/', { back: 1 }],
	['/catalog/', { sel: 'a[href="/catalog"]' }],
	['/ds/bubble-sort/', { sel: 'a[href="/ds/bubble-sort"]' }],
	['/ds/', { sel: '.sec-item[href="/ds"], a[href="/ds"]' }],
	['/db/', { sel: '.sec-item[href="/db"], a[href="/db"]' }],
	['/db/sql/', { sel: 'a[href="/db/sql"]' }],
	['/db/tables/', { sel: 'a[href="/db/tables"]' }],
	['/quiz/', { sel: '.sec-item[href="/quiz"], a[href="/quiz"]' }],
	['/sprint/', { sel: '.sec-item[href="/sprint"], a[href="/sprint"]' }],
	['/progress/', { sel: '.sec-item[href="/progress"], a[href="/progress"]' }],
	['/report/', { sel: '.sec-item[href="/report"], a[href="/report"]' }],
	['/settings/', { sel: 'a[href="/settings"]' }],
	['/about/', { sel: 'a[href="/about"]' }],
	['/home/', { sel: 'a[href="/home"], a[href="/"]' }]
];

for (const [route, how] of steps) {
	if ('sel' in how) {
		let r = await evalJs(
			`(() => { const el = document.querySelector(${JSON.stringify(how.sel)}); if (!el) return 'NO_LINK'; el.click(); return 'OK'; })()`
		);
		if (r === 'NO_LINK') {
			// 滚动收纳会让底导/二级条卸载：先触白条展开（poke），再重试目标
			await evalJs(
				`(() => { const m = document.querySelector('.nav-mini'); if (m) { m.dispatchEvent(new PointerEvent('pointerenter')); m.click(); } return 'ok'; })()`
			);
			await sleep(900);
			r = await evalJs(
				`(() => { const el = document.querySelector(${JSON.stringify(how.sel)}); if (!el) return 'NO_LINK'; el.click(); return 'OK'; })()`
			);
			if (r === 'NO_LINK' && how.sel.startsWith('.sec-item')) {
				const label = route.startsWith('/ds') || route.startsWith('/db') ? '课程' : '复习';
				await evalJs(
					`(() => { const t = [...document.querySelectorAll('.bottom-nav .tab')].find((x) => x.textContent.includes('${label}')); if (t) t.click(); return 'ok'; })()`
				);
				await sleep(700);
				r = await evalJs(
					`(() => { const el = document.querySelector(${JSON.stringify(how.sel)}); if (!el) return 'NO_LINK'; el.click(); return 'OK'; })()`
				);
			}
		}
		if (r === 'NO_LINK') {
			console.log(`${THEME} ${route.padEnd(18)} NO_LINK(仍缺入口)`);
			await sleep(1500);
			continue;
		}
	} else if ('back' in how) {
		for (let i = 0; i < how.back; i++) {
			await evalJs('history.back(); "ok"');
			await sleep(900);
		}
	}
	await sleep(1800);
	// 等开屏动画退场（若本轮会话触发）：覆盖层消失后才算页面就绪
	for (let i = 0; i < 8; i++) {
		const splash = await evalJs(`!!document.querySelector('[class*="splash"]')`);
		if (!splash) break;
		await sleep(600);
	}
	const at = await evalJs('location.pathname');
	const probe = await evalJs(
		`JSON.stringify({ title: document.title.slice(0, 26), h1: (document.querySelector('h1')?.textContent ?? '').trim().slice(0, 14), canvas: document.querySelectorAll('canvas').length })`
	);
	const shot = await send('Page.captureScreenshot', { format: 'png' });
	if (shot.result?.data) {
		const { writeFileSync } = await import('node:fs');
		writeFileSync(`D:/tmp/sweep3-${THEME}-${route.replace(/\//g, '_')}.png`, Buffer.from(shot.result.data, 'base64'));
	}
	const ok = at === route ? 'OK ' : 'AT:' + at;
	console.log(`${THEME} ${ok.padEnd(24)}`, probe ?? 'PROBE_FAIL');
}

console.log('JS_ERRORS:', errors.length ? JSON.stringify([...new Set(errors)].slice(0, 8)) : 'none');
ws.close();

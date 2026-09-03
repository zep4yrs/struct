/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// 离线缓存：静态产物（build + 静态文件），版本号随每次构建变化
const CACHE = `structvis-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((c) => c.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	// 清理旧版本缓存
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event: FetchEvent) => {
	// 仅处理 GET 且同源请求
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== self.location.origin) return;

	// 页面导航：网络优先（部署后首次刷新即得新版），离线回落缓存
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request)
				.then((res) => {
					if (res.ok && url.pathname.startsWith('/struct/')) {
						const copy = res.clone();
						caches.open(CACHE).then((c) => c.put(event.request, copy));
					}
					return res;
				})
				.catch(() => caches.match(event.request).then((c) => c ?? caches.match('/struct/')))
		);
		return;
	}

	// 其余同源 GET（hash 指纹的不可变资源）：缓存优先。
	// 断裂防护：部署间隙页面（新 HTML）引用的新 hash 资源未入缓存时走网络；
	// 网络失败则直接透传错误（hash 资源不存在时无可用回退），绝不能命中
	// 旧缓存里其他资源——那会让 chunk 解析错乱（dynamic import TypeError 根因）。
	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;
			return fetch(event.request).then((res) => {
				if (res.ok && url.pathname.startsWith('/struct/')) {
					const copy = res.clone();
					caches.open(CACHE).then((c) => c.put(event.request, copy));
				}
				return res;
			});
		})
	);
});

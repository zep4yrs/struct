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

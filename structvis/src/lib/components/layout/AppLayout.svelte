<script lang="ts">
	import { onMount } from 'svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import SearchDialog from '$lib/components/layout/SearchDialog.svelte';
	import { settings, toggleTheme } from '$lib/stores/settings';
	import { page } from '$app/stores';
	import { base, resolve } from '$app/paths';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// 存储写入失败横幅（audit-11：隐私模式/空间不足时提示导出备份）
	let storageWarning = $state(false);
	let searchOpen = $state(false);
	// SW 更新提示：页面由旧 SW 控制时，新 SW 接管（controllerchange）→ 弹刷新提示
	let updateReady = $state(false);

	function stripBase(path: string): string {
		if (!base || base === '/') return path;
		return path.startsWith(base) ? path.slice(base.length) || '/' : path;
	}

	/** 课程内容页（/ds/*、/db/* 深页）：沉浸模式——隐藏浮动动作簇与底部导航 */
	const immersive = $derived(/^\/(ds|db)\//.test(stripBase($page.url.pathname)));

	const isDark = $derived($settings.theme === 'dark');

	// 快捷键：/ 或 Ctrl+K 打开搜索（输入框/文本域中不响应）
	$effect(() => {
		function onKeydown(e: KeyboardEvent) {
			const target = e.target as HTMLElement;
			if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
			if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
				e.preventDefault();
				searchOpen = true;
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	// 监听持久层写失败事件：会话内只提示一次（persistent.ts 保证派发频率）
	// 同时打全局水合信号：e2e 的 waitForHydratedGlobal 等它（不依赖任何具体按钮）
	// SW 更新探测：仅当本页加载时已由 SW 控制（老访客），新 SW 接管才算「有更新」
	onMount(() => {
		const onStorageWarning = () => (storageWarning = true);
		window.addEventListener('structvis:storage-warning', onStorageWarning);
		document.body.setAttribute('data-app-ready', '1');
		if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
			navigator.serviceWorker.addEventListener('controllerchange', () => (updateReady = true));
		}
		return () => window.removeEventListener('structvis:storage-warning', onStorageWarning);
	});
</script>

<div class="app-root flex min-h-screen flex-col" class:immersive>
	<a href="#main-content" class="skip-link">跳到主要内容</a>

	{#if storageWarning}
		<div class="storage-banner" role="alert">
			<span>
				学习进度保存失败（可能是浏览器隐私模式或存储空间不足）。建议前往
				<a href={resolve('/progress')}>学习进度页</a> 导出备份，避免记录丢失。
			</span>
			<button
				class="storage-banner-close"
				aria-label="关闭提示"
				onclick={() => (storageWarning = false)}
			>
				✕
			</button>
		</div>
	{/if}

	<!-- 右上浮动动作簇：搜索 / 主题 / 设置（v3 布局：顶栏移除后的全局动作入口；
		课程内容页沉浸隐藏，路径线由 AlgoPage 承担） -->
	{#if !immersive}
		<div class="fab-cluster">
			<button
				class="fab-btn"
				aria-label="全局搜索"
				title="全局搜索 (/)"
				onclick={() => (searchOpen = true)}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
			</button>
			<button
				class="fab-btn"
				aria-label={isDark ? '切换到亮色主题' : '切换到暗色主题'}
				title={isDark ? '切换到亮色主题' : '切换到暗色主题'}
				onclick={toggleTheme}
			>
				{#if isDark}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="4" />
						<path
							d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
						/>
					</svg>
				{:else}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
					</svg>
				{/if}
			</button>
			<a href={resolve('/settings')} class="fab-btn" aria-label="我的" title="我的">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
				</svg>
			</a>
		</div>
	{/if}

	<!-- 页面切换动画：路由 pathname 变化 → key 重建 → 入场上浮淡入 -->
	<main id="main-content" tabindex="-1" class="flex-1">
		{#key $page.url.pathname}
			<div class="page-transition">
				{@render children()}
			</div>
		{/key}
	</main>

	<BottomNav />
</div>

{#if updateReady}
	<div class="update-toast" role="status">
		<span>🔄 新版本已就绪</span>
		<button class="update-reload" onclick={() => location.reload()}>立即刷新</button>
		<button class="update-close" aria-label="关闭提示" onclick={() => (updateReady = false)}
			>✕</button
		>
	</div>
{/if}

<SearchDialog open={searchOpen} onClose={() => (searchOpen = false)} />

<style>
	.skip-link {
		position: fixed;
		top: -48px;
		left: 12px;
		z-index: 200;
		padding: 8px 16px;
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition: top 120ms ease-out;
	}

	.skip-link:focus-visible {
		top: 8px;
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* 页面切换动画：路由 key 重建时上浮淡入（reduced-motion 直出） */
	.page-transition {
		animation: page-in 300ms var(--ease-out) both;
	}

	@keyframes page-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.page-transition {
			animation: none;
		}
	}

	/* 右上浮动动作簇（v3：顶栏移除后的全局动作入口） */
	.fab-cluster {
		position: fixed;
		top: 14px;
		right: 16px;
		z-index: 60;
		display: flex;
		gap: 4px;
		padding: 4px;
		/* 与底导胶囊同款 3D 磨砂：半透磨砂底 + 顶缘镜面 + 底缘暗边 + 双层悬浮投影 */
		background: color-mix(in srgb, var(--color-surface) 46%, transparent);
		border: 1px solid var(--color-line-hair);
		border-radius: 999px;
		-webkit-backdrop-filter: blur(14px) saturate(1.7);
		backdrop-filter: blur(14px) saturate(1.7);
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			inset 0 -1px 0 rgb(0 0 0 / 0.06),
			0 4px 10px rgb(0 0 0 / 0.08),
			0 10px 32px rgb(0 0 0 / 0.16);
	}

	/* 顶缘液态流光带（与底导一致） */
	.fab-cluster::before {
		content: '';
		position: absolute;
		inset: 1px;
		border-radius: inherit;
		pointer-events: none;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.18), transparent 42%);
	}

	.fab-btn:active {
		transform: scale(0.94);
	}

	.fab-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 999px;
		background: transparent;
		color: var(--color-ink-2);
		cursor: pointer;
		text-decoration: none;
		transition:
			color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.fab-btn:hover {
		color: var(--color-ink);
		background: var(--color-subtle);
	}

	.fab-btn svg {
		width: 19px;
		height: 19px;
	}

	/* 存储失败横幅（audit-11） */
	.storage-banner {
		position: fixed;
		top: 64px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 150;
		display: flex;
		align-items: center;
		gap: 12px;
		max-width: min(640px, calc(100vw - 32px));
		padding: 10px 14px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-danger);
		background: rgba(155, 34, 38, 0.08);
		border: 1px solid rgba(155, 34, 38, 0.3);
		border-radius: var(--radius-md);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.storage-banner a {
		color: var(--color-danger);
		font-weight: 500;
		text-decoration: underline;
	}

	.storage-banner-close {
		flex-shrink: 0;
		border: none;
		background: transparent;
		color: inherit;
		font-size: 13px;
		cursor: pointer;
		padding: 2px 4px;
	}

	/* 底部导航占位：防止固定底栏遮挡页面末尾内容（沉浸页导航隐藏，无需补偿） */
	@media (max-width: 767px) {
		.app-root:not(.immersive) {
			padding-bottom: calc(54px + env(safe-area-inset-bottom));
		}
	}

	/* SW 更新提示条（悬浮于底部导航上方，底导同款 3D 磨砂胶囊） */
	.update-toast {
		position: fixed;
		bottom: calc(84px + env(safe-area-inset-bottom));
		left: 50%;
		transform: translateX(-50%);
		z-index: 160;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 16px;
		font-size: 13px;
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-surface) 46%, transparent);
		border: 1px solid var(--color-line-hair);
		border-radius: 999px;
		-webkit-backdrop-filter: blur(14px) saturate(1.7);
		backdrop-filter: blur(14px) saturate(1.7);
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			inset 0 -1px 0 rgb(0 0 0 / 0.06),
			0 4px 10px rgb(0 0 0 / 0.08),
			0 10px 32px rgb(0 0 0 / 0.16);
		animation: toast-in 260ms var(--ease-out) both;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.update-reload {
		border: none;
		border-radius: 999px;
		background: var(--color-accent);
		color: #fff;
		font-size: 12.5px;
		font-weight: 500;
		padding: 6px 14px;
		cursor: pointer;
	}

	.update-reload:hover {
		filter: brightness(1.05);
	}

	.update-close {
		border: none;
		background: transparent;
		color: var(--color-ink-3);
		cursor: pointer;
		font-size: 12px;
		padding: 2px;
	}
</style>

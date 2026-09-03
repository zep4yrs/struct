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
	onMount(() => {
		const onStorageWarning = () => (storageWarning = true);
		window.addEventListener('structvis:storage-warning', onStorageWarning);
		document.body.setAttribute('data-app-ready', '1');
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

	<main id="main-content" tabindex="-1" class="flex-1">
		{@render children()}
	</main>

	<BottomNav />
</div>

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

	/* 右上浮动动作簇（v3：顶栏移除后的全局动作入口） */
	.fab-cluster {
		position: fixed;
		top: 14px;
		right: 16px;
		z-index: 60;
		display: flex;
		gap: 4px;
		padding: 4px;
		background: color-mix(in srgb, var(--color-surface) 72%, transparent);
		border: 1px solid var(--color-line-hair);
		border-radius: 999px;
		-webkit-backdrop-filter: blur(14px) saturate(1.5);
		backdrop-filter: blur(14px) saturate(1.5);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
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
</style>

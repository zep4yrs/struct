<script lang="ts">
	import { onMount } from 'svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import { page } from '$app/stores';
	import { base, resolve } from '$app/paths';
	import { dsTopics, dbTopics } from '$lib/content/topics';
	import { configureAnimEngine } from '$lib/utils/animEngine';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let sidebarOpen = $state(false);
	// 存储写入失败横幅（audit-11：隐私模式/空间不足时提示导出备份）
	let storageWarning = $state(false);

	// 面包屑由 topics.ts 单源生成（href → crumb）
	const crumbByHref = new Map<string, string>(
		[...dsTopics, ...dbTopics].map((t) => [t.href, t.crumb])
	);

	// $page.url.pathname 含 base 前缀（如 /struct/db/view），先剥离 base 再匹配
	function stripBase(path: string): string {
		if (!base || base === '/') return path;
		if (!path.startsWith(base)) return path;
		return path.slice(base.length) || '/';
	}

	function getActiveSection(path: string): 'ds' | 'db' | 'progress' {
		if (path.startsWith('/db')) return 'db';
		if (path.startsWith('/progress')) return 'progress';
		return 'ds';
	}

	function getCrumb(path: string): string {
		if (path === '/' || path === '') return '';
		const topicCrumb = crumbByHref.get(path);
		if (topicCrumb) return topicCrumb;
		if (path.startsWith('/catalog')) return '[current]课程目录[/current]';
		if (path.startsWith('/progress')) return '[current]学习进度[/current]';
		if (path.startsWith('/race')) return '[current]竞速实验室[/current]';
		if (path.startsWith('/map')) return '[current]技能图谱[/current]';
		if (path.startsWith('/quiz')) return '[current]章节自测[/current]';
		if (path.startsWith('/report')) return '[current]学习报告[/current]';
		if (path.startsWith('/settings')) return '[current]设置[/current]';
		if (path.startsWith('/about')) return '[current]关于[/current]';
		return '';
	}

	const activeSection = $derived(getActiveSection(stripBase($page.url.pathname)));
	const crumb = $derived(getCrumb(stripBase($page.url.pathname)));
	const isHome = $derived(stripBase($page.url.pathname) === '/');

	// 监听持久层写失败事件：会话内只提示一次（persistent.ts 保证派发频率）
	onMount(() => {
		const onStorageWarning = () => (storageWarning = true);
		window.addEventListener('structvis:storage-warning', onStorageWarning);
		return () => window.removeEventListener('structvis:storage-warning', onStorageWarning);
	});
</script>

<div class="app-root flex min-h-screen flex-col">
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

	<TopBar
		{crumb}
		showSidebarBtn={!isHome}
		{sidebarOpen}
		onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
	/>

	<div class="flex min-h-0 flex-1">
		<Sidebar {activeSection} open={!isHome && sidebarOpen} onClose={() => (sidebarOpen = false)} />

		<main id="main-content" tabindex="-1" class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>

	<!-- 移动端底部导航（<768px） -->
	<BottomNav />
</div>

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

	/* 存储失败横幅（audit-11） */
	.storage-banner {
		position: fixed;
		top: 56px;
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

	/* 底部导航占位：防止固定底栏遮挡页面末尾内容（<768px） */
	@media (max-width: 767px) {
		.app-root {
			padding-bottom: calc(54px + env(safe-area-inset-bottom));
		}
	}
</style>

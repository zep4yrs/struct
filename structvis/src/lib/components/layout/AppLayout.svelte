<script lang="ts">
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { dsTopics, dbTopics } from '$lib/content/topics';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let sidebarOpen = $state(false);

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
		if (path.startsWith('/settings')) return '设置';
		if (path.startsWith('/about')) return '[current]关于[/current]';
		return '';
	}

	const activeSection = $derived(getActiveSection(stripBase($page.url.pathname)));
	const crumb = $derived(getCrumb(stripBase($page.url.pathname)));
	const isHome = $derived(stripBase($page.url.pathname) === '/');
</script>

<div class="flex min-h-screen flex-col" style="background: var(--color-paper);">
	<a href="#main-content" class="skip-link">跳到主要内容</a>

	<TopBar
		{crumb}
		showSidebarBtn={!isHome}
		{sidebarOpen}
		onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
	/>

	<div class="flex min-h-0 flex-1">
		<Sidebar
			{activeSection}
			open={!isHome && sidebarOpen}
			onClose={() => (sidebarOpen = false)}
		/>

		<main id="main-content" tabindex="-1" class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>
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
</style>

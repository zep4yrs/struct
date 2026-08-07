<script lang="ts">
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let sidebarOpen = $state(false);

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
		if (path.startsWith('/ds/graph-storage')) return '数据结构 / 图 / [current]图的存储[/current]';
		if (path.startsWith('/ds/graph-traversal'))
			return '数据结构 / 图 / [current]图的遍历[/current]';
		if (path.startsWith('/ds/quick-sort')) return '数据结构 / 排序 / [current]快速排序[/current]';
		if (path.startsWith('/ds/binary-tree')) return '数据结构 / 树 / [current]二叉树遍历[/current]';
		if (path.startsWith('/ds/linear-list')) return '数据结构 / 线性表 / [current]单链表[/current]';
		if (path.startsWith('/ds')) return '数据结构';
		if (path.startsWith('/db/overview')) return '数据库 / [current]数据库系统概述[/current]';
		if (path.startsWith('/db/sql')) return '数据库 / MySQL / [current]数据查询[/current]';
		if (path.startsWith('/db/advanced-query'))
			return '数据库 / MySQL / [current]高级查询[/current]';
		if (path.startsWith('/db/update')) return '数据库 / MySQL / [current]数据更新[/current]';
		if (path.startsWith('/db/index')) return '数据库 / [current]索引原理[/current]';
		if (path.startsWith('/db/view')) return '数据库 / [current]视图[/current]';
		if (path.startsWith('/db/er')) return '数据库 / [current]E-R 模型[/current]';
		if (path.startsWith('/db/normalize')) return '数据库 / [current]关系规范化[/current]';
		if (path.startsWith('/db/transaction')) return '数据库 / [current]事务与并发控制[/current]';
		if (path.startsWith('/db/users')) return '数据库 / [current]用户与权限管理[/current]';
		if (path.startsWith('/db/tables')) return '数据库 / [current]建表练习[/current]';
		if (path.startsWith('/db/triggers')) return '数据库 / [current]触发器[/current]';
		if (path.startsWith('/db/procedures')) return '数据库 / [current]存储过程[/current]';
		if (path.startsWith('/db')) return '数据库';
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
		<Sidebar {activeSection} open={!isHome && sidebarOpen} />

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

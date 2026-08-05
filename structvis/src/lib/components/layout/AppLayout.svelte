<script lang="ts">
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { page } from '$app/stores';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let sidebarOpen = $state(false);

	function getActiveSection(path: string): 'ds' | 'db' | 'progress' {
		if (path.startsWith('/db')) return 'db';
		if (path.startsWith('/progress')) return 'progress';
		return 'ds';
	}

	function getCrumb(path: string): string {
		if (path === '/' || path === '') return '';
		if (path.startsWith('/ds/quick-sort')) return '数据结构 / 排序 / [current]快速排序[/current]';
		if (path.startsWith('/ds/binary-tree')) return '数据结构 / 树 / [current]二叉树遍历[/current]';
		if (path.startsWith('/ds/linear-list')) return '数据结构 / 线性表 / [current]单链表[/current]';
		if (path.startsWith('/ds')) return '数据结构';
		if (path.startsWith('/db/sql')) return '数据库 / MySQL / [current]数据查询[/current]';
		if (path.startsWith('/db/update')) return '数据库 / MySQL / [current]数据更新[/current]';
		if (path.startsWith('/db/index')) return '数据库 / [current]索引原理[/current]';
		if (path.startsWith('/db/er')) return '数据库 / [current]E-R 模型[/current]';
		if (path.startsWith('/db/normalize')) return '数据库 / [current]关系规范化[/current]';
		if (path.startsWith('/db/tables')) return '数据库 / [current]建表练习[/current]';
		if (path.startsWith('/db')) return '数据库';
		if (path.startsWith('/progress')) return '[current]学习进度[/current]';
		return '';
	}

	const activeSection = $derived(getActiveSection($page.url.pathname));
	const crumb = $derived(getCrumb($page.url.pathname));
	const isHome = $derived($page.url.pathname === '/');
</script>

<div class="flex min-h-screen flex-col" style="background: var(--color-paper);">
	<TopBar
		{crumb}
		showSidebarBtn={!isHome}
		{sidebarOpen}
		onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
	/>

	<div class="flex min-h-0 flex-1">
		<Sidebar {activeSection} open={!isHome && sidebarOpen} />

		<main class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>

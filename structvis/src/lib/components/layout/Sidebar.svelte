<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	interface NavItem {
		title: string;
		href: string;
		icon?: string;
		planned?: boolean;
	}

	interface NavGroup {
		title: string;
		items: NavItem[];
	}

	interface Props {
		activeSection: 'ds' | 'db' | 'progress';
		open: boolean;
	}

	let { activeSection, open }: Props = $props();

	const dsGroups: NavGroup[] = [
		{
			title: '线性结构',
			items: [
				{ title: '线性表', href: '/ds/linear-list' },
				{ title: '栈和队列', href: '/ds/stack-queue' },
				{ title: '串的模式匹配（KMP）', href: '/ds/kmp' }
			]
		},
		{
			title: '树形结构',
			items: [
				{ title: '二叉树遍历', href: '/ds/binary-tree' },
				{ title: '二叉搜索树', href: '/ds/bst' },
				{ title: '哈夫曼树', href: '/ds/huffman' }
			]
		},
		{
			title: '图结构',
			items: [
				{ title: '图的存储', href: '/ds/graph-storage' },
				{ title: '图的遍历', href: '/ds/graph-traversal' },
				{ title: '最短路径', href: '/ds/shortest-path' },
				{ title: '最小生成树', href: '/ds/mst' },
				{ title: '拓扑排序', href: '/ds/topo-sort' },
				{ title: '关键路径', href: '/ds/critical-path' }
			]
		},
		{
			title: '排序算法',
			items: [
				{ title: '快速排序', href: '/ds/quick-sort' },
				{ title: '冒泡排序', href: '/ds/bubble-sort' },
				{ title: '直接插入排序', href: '/ds/insertion-sort' },
				{ title: '简单选择排序', href: '/ds/selection-sort' },
				{ title: '归并排序', href: '/ds/merge-sort' }
			]
		},
		{
			title: '查找',
			items: [
				{ title: '二分查找', href: '/ds/binary-search' },
				{ title: '哈希表', href: '/ds/hash-table' }
			]
		}
	];

	const dbGroups: NavGroup[] = [
		{
			title: '基础',
			items: [
				{ title: '数据库系统概述', href: '/db/overview' },
				{ title: '数据库和表', href: '/db/tables' },
				{ title: '数据查询', href: '/db/sql' },
				{ title: '高级查询', href: '/db/advanced-query' },
				{ title: '数据更新', href: '/db/update' }
			]
		},
		{
			title: '进阶',
			items: [
				{ title: '索引原理', href: '/db/index' },
				{ title: '视图', href: '/db/view' }
			]
		},
		{
			title: '设计',
			items: [
				{ title: 'E-R 模型', href: '/db/er' },
				{ title: '关系规范化', href: '/db/normalize' }
			]
		},
		{
			title: '运维',
			items: [
				{ title: '事务与并发控制', href: '/db/transaction' },
				{ title: '用户与权限管理', href: '/db/users' }
			]
		}
	];

	const groups = $derived(
		activeSection === 'ds' ? dsGroups : activeSection === 'db' ? dbGroups : []
	);

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}
</script>

<nav
	aria-label="课程目录"
	class="hidden h-full flex-shrink-0 overflow-hidden border-r transition-[width,color] duration-300 md:block"
	style="
		border-color: {open ? 'var(--color-line-hair)' : 'transparent'};
		background: var(--color-paper);
		width: {open ? '224px' : '0px'};
	"
>
	<div class="h-full w-56 overflow-y-auto py-4">
		{#each groups as group (group.title)}
			<div class="mb-6">
				<div
					class="mb-2 px-4 font-mono text-[11px] tracking-widest uppercase"
					style="color: var(--color-ink-3);"
				>
					{group.title}
				</div>
				{#each group.items as item (item.title)}
					<a
						href={item.planned ? undefined : base + item.href}
						class="flex items-center gap-3 border-l-2 px-4 py-1.5 text-sm no-underline transition-all"
						style="
						border-color: transparent;
						color: {isActive(item.href) ? 'var(--color-ink)' : 'var(--color-ink-2)'};
						background: {isActive(item.href) ? 'rgba(217, 119, 6, 0.06)' : 'transparent'};
						border-left-color: {isActive(item.href) ? 'var(--color-accent)' : 'transparent'};
						font-weight: {isActive(item.href) ? '500' : '400'};
						opacity: {item.planned ? '0.5' : '1'};
						cursor: {item.planned ? 'not-allowed' : 'pointer'};
					"
						onclick={(e: MouseEvent) => item.planned && e.preventDefault()}
						title={item.planned ? '规划中，敬请期待' : ''}
					>
						<span class="flex-1 truncate">{item.title}</span>
						{#if item.planned}
							<span
								class="font-mono text-[10px] tracking-wider uppercase"
								style="color: var(--color-ink-3);"
							>
								soon
							</span>
						{/if}
					</a>
				{/each}
			</div>
		{/each}

		<!-- 进度入口（在侧栏底部） -->
		{#if activeSection !== 'progress'}
			<div class="mt-4 border-t pt-4" style="border-color: var(--color-line-hair);">
				<a
					href={base + '/progress'}
					class="flex items-center gap-3 border-l-2 px-4 py-1.5 text-sm no-underline transition-all"
					style="
					border-color: transparent;
					color: var(--color-ink-2);
				"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M12 20v-6M6 20V10M18 20V4" />
					</svg>
					<span>学习进度</span>
				</a>
			</div>
		{/if}

		<!-- 设置入口（在侧栏底部） -->
		<div class="mt-2 border-t pt-3" style="border-color: var(--color-line-hair);">
			<a
				href={base + '/settings'}
				class="flex items-center gap-3 border-l-2 px-4 py-1.5 text-sm no-underline transition-all"
				style="
				border-color: transparent;
				color: var(--color-ink-2);
			"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
				</svg>
				<span>设置</span>
			</a>
		</div>
	</div>
</nav>

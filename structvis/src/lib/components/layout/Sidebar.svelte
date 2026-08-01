<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';

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
	}

	let { activeSection }: Props = $props();

	const dsGroups: NavGroup[] = [
		{
			title: '线性结构',
			items: [
				{ title: '线性表', href: '/ds/linear-list' },
				{ title: '栈和队列', href: '/ds/stack-queue' },
				{ title: '串与数组', href: '#', planned: true }
			]
		},
		{
			title: '树形结构',
			items: [
				{ title: '二叉树遍历', href: '/ds/binary-tree' },
				{ title: '二叉搜索树', href: '#', planned: true },
				{ title: '哈夫曼树', href: '#', planned: true }
			]
		},
		{
			title: '图结构',
			items: [{ title: '图的遍历', href: '#', planned: true }]
		},
		{
			title: '排序算法',
			items: [
				{ title: '快速排序', href: '/ds/quick-sort' },
				{ title: '冒泡排序', href: '#', planned: true },
				{ title: '插入排序', href: '#', planned: true },
				{ title: '归并排序', href: '#', planned: true }
			]
		},
		{
			title: '查找',
			items: [
				{ title: '二分查找', href: '#', planned: true },
				{ title: '哈希表', href: '#', planned: true }
			]
		}
	];

	const dbGroups: NavGroup[] = [
		{
			title: '基础',
			items: [
				{ title: '数据库和表', href: '/db/tables' },
				{ title: '数据查询', href: '/db/sql' }
			]
		},
		{
			title: '进阶',
			items: [
				{ title: '数据更新', href: '#', planned: true },
				{ title: '索引与视图', href: '#', planned: true }
			]
		},
		{
			title: '设计',
			items: [
				{ title: 'E-R 模型', href: '#', planned: true },
				{ title: '关系规范化', href: '#', planned: true }
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

<aside
	class="hidden h-full w-56 flex-shrink-0 overflow-y-auto border-r py-4 md:block"
	style="border-color: var(--color-line-hair); background: var(--color-paper);"
>
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
					href={item.planned ? undefined : resolve(item.href as RouteId)}
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
				href={resolve('/progress')}
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
</aside>

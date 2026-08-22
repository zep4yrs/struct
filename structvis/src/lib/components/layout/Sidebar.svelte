<script lang="ts">
	import { page } from '$app/stores';
	import { base, resolve } from '$app/paths';
	import type { RouteId } from '../../../routes/$types';
	import {
		dsTopics,
		dbTopics,
		DS_GROUP_ORDER,
		DB_GROUP_ORDER,
		type TopicCard
	} from '$lib/content/topics';

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
		onClose?: () => void;
	}

	let { activeSection, open, onClose = () => {} }: Props = $props();

	// 导航分组由 topics.ts 单源生成（分组名/顺序/条目全部来自目录数据，不再单独维护）
	function buildGroups(topics: TopicCard[], order: readonly string[]): NavGroup[] {
		return order
			.map((g) => ({
				title: g,
				items: topics
					.filter((t) => t.group === g)
					.map((t) => ({ title: t.title, href: t.href, planned: t.planned }))
			}))
			.filter((g) => g.items.length > 0);
	}

	const groups = $derived(
		activeSection === 'ds'
			? buildGroups(dsTopics, DS_GROUP_ORDER)
			: activeSection === 'db'
				? buildGroups(dbTopics, DB_GROUP_ORDER)
				: []
	);

	// $page.url.pathname 含 base 前缀，剥离后再匹配高亮
	function strippedPath(): string {
		const p = $page.url.pathname;
		if (!base || base === '/') return p;
		return p.startsWith(base) ? p.slice(base.length) || '/' : p;
	}

	function isActive(href: string): boolean {
		return strippedPath().startsWith(href);
	}

	// Esc 关闭抽屉
	$effect(() => {
		if (!open) return;
		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

<!-- 移动端遮罩 -->
{#if open}
	<button class="drawer-backdrop" aria-label="关闭导航" onclick={onClose}></button>
{/if}

<nav
	aria-label="课程目录"
	class="glass drawer {open
		? 'open'
		: ''} h-full flex-shrink-0 overflow-hidden border-r transition-[width,color] duration-300 md:block"
	style="
		border-color: {open ? 'var(--color-line-hair)' : 'transparent'};
		background: var(--color-surface);
		width: {open ? '224px' : '0px'};
	"
>
	<div class="h-full w-56 overflow-y-auto py-4">
		<!-- 移动端关闭按钮 -->
		<div class="mb-2 px-2 md:hidden">
			<button
				class="btn btn-ghost btn-icon-lg ml-auto flex"
				style="color: var(--color-ink-2);"
				aria-label="关闭导航"
				title="关闭导航"
				onclick={onClose}
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
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
		<!-- 课程目录入口 -->
		<div class="mb-4 px-4">
			<a
				href={resolve('/catalog')}
				class="sidebar-link flex items-center gap-3 border-l-2 px-4 py-1.5 text-sm no-underline transition-all"
				style="
				border-color: transparent;
				color: {isActive('/catalog') ? 'var(--color-ink)' : 'var(--color-ink-2)'};
				background: {isActive('/catalog') ? 'rgba(217, 119, 6, 0.06)' : 'transparent'};
				border-left-color: {isActive('/catalog') ? 'var(--color-accent)' : 'transparent'};
				font-weight: {isActive('/catalog') ? '500' : '400'};
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
					<path d="M3 3v18h18" />
					<path d="M7 8h3M7 12h8M7 16h5" />
				</svg>
				<span>课程目录</span>
			</a>
		</div>

		{#each groups as group (group.title)}
			<div class="mb-6">
				<div
					class="mb-2 px-4 font-mono text-[11px] tracking-widest uppercase"
					style="color: var(--color-ink-2);"
				>
					{group.title}
				</div>
				{#each group.items as item (item.title)}
					<a
						href={item.planned ? undefined : resolve(item.href as RouteId)}
						class="sidebar-link flex items-center gap-3 border-l-2 px-4 py-1.5 text-sm no-underline transition-all"
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
					class="sidebar-link flex items-center gap-3 border-l-2 px-4 py-1.5 text-sm no-underline transition-all"
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

		<!-- 关于入口（在侧栏底部） -->
		<div class="mt-2 border-t pt-3" style="border-color: var(--color-line-hair);">
			<a
				href={resolve('/about')}
				class="sidebar-link flex items-center gap-3 border-l-2 px-4 py-1.5 text-sm no-underline transition-all"
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
					<circle cx="12" cy="12" r="10" />
					<path d="M12 16v-4M12 8h.01" />
				</svg>
				<span>关于</span>
			</a>
		</div>

		<!-- 设置入口（在侧栏底部） -->
		<div class="mt-2 border-t pt-3" style="border-color: var(--color-line-hair);">
			<a
				href={resolve('/settings')}
				class="sidebar-link flex items-center gap-3 border-l-2 px-4 py-1.5 text-sm no-underline transition-all"
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
					<path
						d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0-4.68-1.51 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-1.51-1z"
					/>
				</svg>
				<span>设置</span>
			</a>
		</div>
	</div>
</nav>

<style>
	/* 移动端：侧栏作为覆盖式抽屉（fixed + 遮罩），桌面端保持内联宽度切换 */
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: var(--color-scrim);
		border: none;
		padding: 0;
		cursor: default;
	}

	.drawer {
		z-index: 61;
	}

	/* 链接 hover：背景微色 + 左侧高亮条滑入（box-shadow 不受内联边框影响） */
	.sidebar-link {
		transition:
			background-color 0.18s var(--ease-out),
			box-shadow 0.18s var(--ease-out),
			color 0.18s var(--ease-out);
	}

	.sidebar-link:hover {
		background: var(--color-subtle);
		box-shadow: inset 3px 0 0 var(--color-accent);
	}

	@media (max-width: 767px) {
		.drawer {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			height: 100dvh;
			width: 224px !important;
			visibility: hidden;
			transform: translateX(-100%);
			transition:
				transform var(--dur-base) var(--ease-out),
				visibility 0s linear var(--dur-base),
				border-color var(--dur-fast) var(--ease-out);
			box-shadow: none;
		}

		.drawer.open {
			visibility: visible;
			transform: translateX(0);
			transition:
				transform var(--dur-base) var(--ease-out),
				visibility 0s linear 0s,
				border-color var(--dur-fast) var(--ease-out);
			box-shadow: 0 0 40px rgba(0, 0, 0, 0.15);
		}
	}
</style>

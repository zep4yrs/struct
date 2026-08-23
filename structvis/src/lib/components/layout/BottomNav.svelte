<script lang="ts">
	import { page } from '$app/stores';
	import { base, resolve } from '$app/paths';

	/** 移动端底部导航（Story：手机改底部导航样式）
	 *  - 仅 <768px 显示；五个高频目的地，关于/设置仍走顶栏图标
	 *  - 课程分组的深层导航继续使用顶栏抽屉，本栏只做全局一级跳转
	 *  - 触控目标 ≥52px 高，含 iOS 安全区适配
	 */
	interface TabItem {
		href: string;
		label: string;
		activeMatch?: (p: string) => boolean;
		icon: string;
	}

	function stripBase(path: string): string {
		if (!base || base === '/') return path;
		return path.startsWith(base) ? path.slice(base.length) || '/' : path;
	}

	const TABS: TabItem[] = [
		{
			href: '/catalog',
			label: '课程',
			activeMatch: (p) => p.startsWith('/catalog') || p.startsWith('/ds/') || p.startsWith('/db/'),
			icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3 3h7z'
		},
		{
			href: '/progress',
			label: '进度',
			activeMatch: (p) => p.startsWith('/progress') || p.startsWith('/report'),
			icon: 'M18 20V10M12 20V4M6 20v-6'
		},
		{
			href: '/quiz',
			label: '自测',
			icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM9 13l2 2 4-4'
		},
		{
			href: '/race',
			label: '竞速',
			icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z'
		},
		{
			href: '/map',
			label: '图谱',
			activeMatch: (p) => p.startsWith('/map'),
			icon: 'M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9'
		}
	];

	const current = $derived(stripBase($page.url.pathname));

	function isActive(item: TabItem): boolean {
		if (item.activeMatch) return item.activeMatch(current);
		return current === item.href || current.startsWith(item.href);
	}
</script>

<nav class="bottom-nav" aria-label="底部导航">
	{#each TABS as item (item.href)}
		{@const active = isActive(item)}
		<a
			href={resolve(item.href as '/catalog')}
			class="tab"
			class:active
			aria-current={active ? 'page' : undefined}
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
				<path d={item.icon} />
			</svg>
			<span>{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 45;
		display: none;
		align-items: stretch;
		background: var(--color-surface);
		border-top: 1px solid var(--color-line-hair);
		padding-bottom: env(safe-area-inset-bottom);
		-webkit-backdrop-filter: blur(14px) saturate(1.5);
		backdrop-filter: blur(14px) saturate(1.5);
	}

	@media (max-width: 767px) {
		.bottom-nav {
			display: flex;
		}
	}

	.tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		min-height: 54px;
		font-size: 10px;
		line-height: 1;
		color: var(--color-ink-2);
		text-decoration: none;
		transition: color 120ms var(--ease-out);
	}

	.tab svg {
		width: 22px;
		height: 22px;
	}

	.tab.active {
		color: var(--color-accent-text);
		font-weight: 600;
	}

	.tab:active {
		transform: scale(0.96);
	}
</style>

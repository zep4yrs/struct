<script lang="ts">
	import { page } from '$app/stores';
	import { base, resolve } from '$app/paths';

	/** 全端统一底部导航（v3 布局：hub + 底导，顶栏移除）
	 *  - 五个一级目的地：首页 / 课程 / 实验 / 复习 / 我的
	 *  - 桌面 ≥768px：居中悬浮胶囊；移动 <768px：通栏贴底（安全区适配）
	 *  - 课程内容页（/ds/*、/db/* 深页）沉浸隐藏——路径线由 AlgoPage 的返回+pager 承担
	 */
	interface TabItem {
		href: string;
		label: string;
		activeMatch: (p: string) => boolean;
		icon: string;
	}

	function stripBase(path: string): string {
		if (!base || base === '/') return path;
		if (!path.startsWith(base)) return path;
		// 归一化尾部斜杠：dev/Pages 以目录 URL（…/home/）服务，tab 精确匹配需无尾斜杠
		const stripped = (path.slice(base.length) || '/').replace(/\/+$/, '');
		return stripped === '' ? '/' : stripped;
	}

	const TABS: TabItem[] = [
		{
			href: '/home',
			label: '首页',
			activeMatch: (p) => p === '/' || p === '/home',
			icon: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5'
		},
		{
			href: '/catalog',
			label: '课程',
			activeMatch: (p) => p.startsWith('/catalog') || p.startsWith('/ds') || p.startsWith('/db'),
			icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3 3h7z'
		},
		{
			href: '/race',
			label: '实验',
			activeMatch: (p) => p.startsWith('/race') || p.startsWith('/map'),
			icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z'
		},
		{
			href: '/progress',
			label: '复习',
			activeMatch: (p) =>
				p.startsWith('/progress') || p.startsWith('/quiz') || p.startsWith('/report'),
			icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 13l2 2 4-4'
		},
		{
			href: '/settings',
			label: '我的',
			activeMatch: (p) => p.startsWith('/settings') || p.startsWith('/about'),
			icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
		}
	];

	const current = $derived(stripBase($page.url.pathname));

	/** 课程内容页沉浸：底部导航隐藏（路径线由 AlgoPage 返回 + pager 承担） */
	const immersive = $derived(/^\/(ds|db)\//.test(current));

	function isActive(item: TabItem): boolean {
		return item.activeMatch(current);
	}
</script>

{#if !immersive}
	<nav class="bottom-nav" aria-label="底部导航">
		<div class="nav-inner">
			{#each TABS as item (item.href)}
				{@const active = isActive(item)}
				<a
					href={resolve(item.href as '/')}
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
		</div>
	</nav>
{/if}

<style>
	.bottom-nav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 80;
		display: flex;
		justify-content: center;
		padding-bottom: env(safe-area-inset-bottom);
		pointer-events: none; /* 胶囊外区域不拦截点击 */
	}

	/* ═══ 3D 液态玻璃胶囊 ═══
	   磨砂基底（blur+saturate+grain）+ 三层立体光影：顶缘镜面高光 /
	   底缘内暗边（厚度）/ 悬浮投影（脱离感）；::before 沿顶缘的
	   液态高光带让玻璃「湿润」。 */
	.nav-inner {
		pointer-events: auto;
		position: relative;
		display: flex;
		align-items: stretch;
		gap: 4px;
		width: 100%;
		background: color-mix(in srgb, var(--color-surface) 62%, transparent);
		border-top: 1px solid var(--color-line-hair);
		-webkit-backdrop-filter: blur(24px) saturate(1.6);
		backdrop-filter: blur(24px) saturate(1.6);
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			inset 0 -1px 0 rgb(0 0 0 / 0.06);
		animation: nav-enter 420ms var(--ease-out) both;
	}

	/* 顶缘液态高光带（磨砂面上的镜面流光） */
	.nav-inner::before {
		content: '';
		position: absolute;
		inset: 1px;
		border-radius: inherit;
		pointer-events: none;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.18), transparent 42%);
	}

	/* 磨砂噪点肌理（feTurbulence 5%） */
	.nav-inner::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		opacity: 0.05;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	@keyframes nav-enter {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-inner {
			animation: none;
		}
	}

	/* 桌面 ≥768px：居中悬浮胶囊（完全体 3D 玻璃） */
	@media (min-width: 768px) {
		.nav-inner {
			width: auto;
			margin-bottom: 18px;
			padding: 6px 10px;
			border: 1px solid var(--color-line-regular);
			border-radius: 999px;
			box-shadow:
				inset 0 1px 0 var(--glass-hi),
				inset 0 -1px 0 rgb(0 0 0 / 0.06),
				0 4px 10px rgb(0 0 0 / 0.08),
				0 14px 40px rgb(0 0 0 / 0.18);
		}
	}

	.tab {
		flex: 1;
		position: relative;
		z-index: 1; /* 浮于 ::before/::after 光影层之上 */
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		min-height: 54px;
		min-width: 58px;
		padding: 4px 10px;
		border-radius: 14px;
		font-size: 10px;
		line-height: 1;
		color: var(--color-ink-2);
		text-decoration: none;
		transition:
			color 150ms var(--ease-out),
			background-color 150ms var(--ease-out),
			transform 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}

	.tab svg {
		width: 21px;
		height: 21px;
		transition: transform 150ms var(--ease-out);
	}

	.tab:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
	}

	.tab:hover svg {
		transform: translateY(-1px) scale(1.06);
	}

	/* 激活态：玻璃凸起按钮（3D 浮粒）+ accent 光晕 */
	.tab.active {
		color: var(--color-accent-text);
		font-weight: 600;
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.22),
			0 2px 8px color-mix(in srgb, var(--color-accent) 26%, transparent);
	}

	.tab.active svg {
		filter: drop-shadow(0 1px 4px color-mix(in srgb, var(--color-accent) 40%, transparent));
	}

	/* 按压回弹（iOS tactile） */
	.tab:active {
		transform: scale(0.94);
	}

	/* 移动态：胶囊退为通栏（保留磨砂 + 光影，去圆角与外投影） */
	@media (max-width: 767px) {
		.nav-inner {
			border-left: none;
			border-right: none;
			border-bottom: none;
			border-radius: 0;
			box-shadow:
				inset 0 1px 0 var(--glass-hi),
				0 -6px 24px rgb(0 0 0 / 0.06);
		}

		.tab {
			border-radius: 0;
		}

		.tab.active {
			border-radius: 12px 12px 0 0;
		}
	}
</style>

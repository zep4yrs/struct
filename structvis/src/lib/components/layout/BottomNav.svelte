<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base, resolve } from '$app/paths';
	import { fade, fly } from 'svelte/transition';
	import { prefersReducedMotion } from '$lib/utils/motion';

	/** 全端统一底部导航（v3 布局：hub + 底导，顶栏移除）
	 *  - 五个一级目的地：首页 / 课程 / 实验 / 复习 / 我的
	 *  - 桌面 ≥768px：居中悬浮胶囊；移动 <768px：通栏贴底（安全区适配）
	 *  - 课程内容页（/ds/*、/db/* 深页）沉浸隐藏——路径线由 AlgoPage 的返回+pager 承担
	 *  - 指针/触摸拖拽：按住滑块水平拖动，跨过 tab 中线释放即切换（drag-to-switch）
	 *  - 闲置收纳：10s 无交互缩为小白条，任意交互即展开
	 *  - 二级导航：处于某 tab 的子页面时，从主导航上方弹出二级胶囊（子页面直切）
	 */
	interface TabItem {
		href: string;
		label: string;
		activeMatch: (p: string) => boolean;
		icon: string;
		/** 二级导航项：处于该 tab 的子页面（非落点）时从主导航上方弹出 */
		children?: { label: string; href: string; icon: string }[];
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
			icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3 3h7z',
			children: [
				{
					label: '课程目录',
					href: '/catalog',
					icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z'
				},
				{
					label: '数据结构',
					href: '/ds',
					icon: 'M12 3v6m0 0c0 3-4 3-4 6m4-6c0 3 4 3 4 6M6 12h12M8 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z'
				},
				{
					label: '数据库',
					href: '/db',
					icon: 'M12 3c4.97 0 9 1.34 9 3s-4.03 3-9 3-9-1.34-9-3 4.03-3 9-3zm9 6v6c0 1.66-4.03 3-9 3s-9-1.34-9-3V9m18 0c0 1.66-4.03 3-9 3s-9-1.34-9-3'
				}
			]
		},
		{
			href: '/race',
			label: '实验',
			activeMatch: (p) =>
				p.startsWith('/race') || p.startsWith('/map') || p.startsWith('/db/workbench'),
			icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
			children: [
				{
					label: '竞速实验室',
					href: '/race',
					icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z'
				},
				{
					label: '技能图谱',
					href: '/map',
					icon: 'M12 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-7 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm14 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM12 9v3m0 0-6.5 4M12 12l6.5 4'
				},
				{
					label: 'SQL 工作台',
					href: '/db/workbench',
					icon: 'M4 17l6-6-6-6M12 19h8'
				}
			]
		},
		{
			href: '/progress',
			label: '复习',
			activeMatch: (p) =>
				p.startsWith('/progress') ||
				p.startsWith('/quiz') ||
				p.startsWith('/report') ||
				p.startsWith('/sprint'),
			icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 13l2 2 4-4',
			children: [
				{
					label: '学习进度',
					href: '/progress',
					icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 13l2 2 4-4'
				},
				{
					label: '期末冲刺',
					href: '/sprint',
					icon: 'M4 21V4h12l-2 4 2 4H4m0 9v-9'
				},
				{
					label: '章节自测',
					href: '/quiz',
					icon: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m0 4h.01M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z'
				},
				{
					label: '学习报告',
					href: '/report',
					icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 12h-2m4-4h-6'
				}
			]
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
	// 课题页解除沉浸（主页面同款 tab 栏）；SQL 工作台维持全屏工具台沉浸
	const immersive = $derived(current.startsWith('/db/workbench'));

	function isActive(item: TabItem): boolean {
		return item.activeMatch(current);
	}

	/** 滑块：active tab 下标 → transform 平移（CSS 过渡产生滑动） */
	const activeIndex = $derived(TABS.findIndex((t) => t.activeMatch(current)));

	// ═══ 二级导航：处于配置了 children 的 tab 内（含落点）时，从主导航上方弹出 ═══
	const activeTab = $derived(TABS.find((t) => t.activeMatch(current)) ?? null);
	const secondaryItems = $derived(activeTab?.children ? activeTab.children : null);
	/** 落点页（current==href）已在最上层，返回钮无意义 */
	const atLanding = $derived(!!activeTab && current === activeTab.href);
	/** 层级栈：进入子页面自动 push（二级条覆盖一级），返回钮 pop（收回二级条、一级菜单弹回，页面不动） */
	let secPopped = $state(false);
	function popToPrimary() {
		secPopped = true;
	}
	$effect(() => {
		void current;
		secPopped = false; // 路由变化 = 新的层级推入
	});

	/** 二级条当前项：拖拽中跟随浮点位置，静止时精确匹配优先、否则最长前缀匹配
	 *  （课题页 /ds/bubble-sort → 「数据结构」；/db/workbench → 「SQL 工作台」优先于「数据库」） */
	const secCur = $derived.by(() => {
		const n = secondaryItems?.length ?? 0;
		if (!n) return -1;
		if (secDragPos !== null) return Math.max(0, Math.min(n - 1, Math.round(secDragPos)));
		const exact = secondaryItems!.findIndex((c) => c.href === current);
		if (exact >= 0) return exact;
		let best = -1;
		let bestLen = 0;
		secondaryItems!.forEach((c, i) => {
			if (current.startsWith(c.href) && c.href.length > bestLen) {
				best = i;
				bestLen = c.href.length;
			}
		});
		return best;
	});

	// === 二级条拖拽滑切（与主导航同款：轴线锁定 + 跨中线切换 + 释放吞 click） ===
	let secEl = $state<HTMLDivElement | null>(null);
	let secDrag: {
		startX: number;
		startY: number;
		baseIdx: number;
		moved: boolean;
		pointerId: number;
	} | null = null;
	let secDragPos = $state<number | null>(null);
	let secSuppressUntil = 0;

	function secSegWidth(): number {
		if (!secEl || !secondaryItems) return 1;
		return secEl.clientWidth / secondaryItems.length;
	}

	function secPointerDown(e: PointerEvent) {
		poke(); // 任何交互重置闲置收纳
		if (!secEl || !secondaryItems) return;
		secDrag = {
			startX: e.clientX,
			startY: e.clientY,
			baseIdx: secCur < 0 ? 0 : secCur,
			moved: false,
			pointerId: e.pointerId
		};
	}

	function secPointerMove(e: PointerEvent) {
		if (!secDrag || !secEl || !secondaryItems) return;
		const dx = e.clientX - secDrag.startX;
		const dy = e.clientY - secDrag.startY;
		if (!secDrag.moved) {
			if (Math.abs(dx) <= 6) return;
			if (Math.abs(dy) > Math.abs(dx)) {
				secDrag = null;
				return;
			}
			secDrag.moved = true;
			try {
				secEl.setPointerCapture(secDrag.pointerId);
			} catch {
				/* 忽略 */
			}
		}
		secDragPos = Math.max(
			0,
			Math.min(secondaryItems.length - 1, secDrag.baseIdx + dx / secSegWidth())
		);
	}

	function secPointerUp() {
		if (!secDrag || !secondaryItems) return;
		const wasDrag = secDrag.moved;
		const pos = secDragPos;
		secDrag = null;
		if (!wasDrag || pos === null) return;
		secSuppressUntil = performance.now() + 350;
		const target = Math.round(pos);
		secDragPos = null;
		if (target !== secCur && secondaryItems[target]) {
			goto(resolve(secondaryItems[target].href as '/'));
		}
	}

	function secPointerCancel() {
		secDrag = null;
		secDragPos = null;
	}

	function secClickCapture(e: MouseEvent) {
		if (performance.now() < secSuppressUntil) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	// === 指针/触摸拖拽滑切（drag-to-switch） ===
	// 拖动时滑块跟手（无过渡），释放时按停留位置吸附到最近 tab：
	// 跨过目标 tab 中线才算切换（不足则弹回原 tab）。
	let navEl = $state<HTMLDivElement | null>(null);
	let sliderEl = $state<HTMLDivElement | null>(null);
	let dragState: {
		startX: number;
		startY: number;
		baseOffset: number;
		moved: boolean;
		pointerId: number;
	} | null = null;
	/** 拖拽中的瞬时索引（浮点，滑块跟手）；非拖拽时为 null */
	let dragPos = $state<number | null>(null);

	function segWidth(): number {
		if (!navEl) return 1;
		const inner = navEl.clientWidth - 8; // 与 slider 的 left:4px / calc((100%-8px)/n) 对齐
		return inner / TABS.length;
	}

	function onPointerDown(e: PointerEvent) {
		if (collapsed) {
			poke(); // 白条态：任意触碰先展开，不做拖拽判定
			return;
		}
		if (activeIndex < 0 || !navEl) return;
		dragState = {
			startX: e.clientX,
			startY: e.clientY,
			baseOffset: activeIndex,
			moved: false,
			pointerId: e.pointerId
		};
		// 注意：不在 down 时立即 capture——否则会吞掉 <a> 的原生 click 导航。
		// capture 延迟到确认拖动（moved）后再补，纯点击路径零干预。
		// 另：tab <a draggable="false">——浏览器对链接的原生拖放会在鼠标按住
		// 拖动时劫持指针（后续 pointermove 停发），这是鼠标拖拽失效的根因。
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragState || !navEl) return;
		const dx = e.clientX - dragState.startX;
		const dy = e.clientY - dragState.startY;
		if (!dragState.moved) {
			if (Math.abs(dx) <= 6) return;
			// 轴线锁定：垂直意图（下拉通知/页面滚动）大于水平时放弃拖拽判定，
			// 交还浏览器原生手势——触屏横滑可用的关键
			if (Math.abs(dy) > Math.abs(dx)) {
				dragState = null;
				return;
			}
			dragState.moved = true;
			try {
				navEl.setPointerCapture(dragState.pointerId);
			} catch {
				/* 指针已释放等边缘，忽略 */
			}
		}
		const w = segWidth();
		// 拖拽跟手：限制在 [0, n-1]
		dragPos = Math.max(0, Math.min(TABS.length - 1, dragState.baseOffset + dx / w));
	}

	function onPointerUp() {
		if (!dragState) return;
		const wasDrag = dragState.moved;
		const pos = dragPos;
		dragState = null;
		if (!wasDrag || pos === null) return;
		// 拖动释放后：拦截紧随的 click（释放落点可能在某 tab 内触发原生导航，
		// 与吸附 goto 双跳；真实指针有 capture 兜底，合成/降级路径靠此窗口）
		suppressUntil = performance.now() + 350;
		// 跨过目标 tab 中线（四舍五入）才切换；否则弹回
		const target = Math.round(pos);
		dragPos = null;
		if (target !== activeIndex) {
			goto(resolve(TABS[target].href as '/'));
		}
	}

	function onPointerCancel() {
		dragState = null;
		dragPos = null;
	}

	/** 拖动释放后的短窗口内吞掉 nav 上的 click（防双跳） */
	let suppressUntil = 0;
	function onClickCapture(e: MouseEvent) {
		if (performance.now() < suppressUntil) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	// 滑块渲染位置：拖拽中用跟手浮点值，否则用 activeIndex（CSS 过渡滑动）
	const sliderIndex = $derived(dragPos !== null ? dragPos : activeIndex < 0 ? 0 : activeIndex);

	// ═══ 闲置收纳：10s 无交互缩为小白条，任意交互（含触碰白条）即展开 ═══
	const IDLE_MS = 10000;
	let collapsed = $state(false);
	let idleTimer: ReturnType<typeof setTimeout> | null = null;

	function poke() {
		collapsed = false;
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			collapsed = true;
		}, IDLE_MS);
	}

	onMount(() => {
		poke();
		const evs: (keyof WindowEventMap)[] = [
			'pointerdown',
			'keydown',
			'scroll',
			'wheel',
			'touchstart'
		];
		const onPoke = () => {
			if (collapsed) return; // 已收纳：窗口交互不展开，唯触碰白条展开
			poke();
		};
		evs.forEach((ev) => window.addEventListener(ev, onPoke, { passive: true }));
		return () => {
			evs.forEach((ev) => window.removeEventListener(ev, onPoke));
			if (idleTimer) clearTimeout(idleTimer);
		};
	});
</script>

{#if !immersive}
	<nav class="bottom-nav" aria-label="底部导航">
		<!-- 二级导航条：覆盖弹出在主导航上方；与一级 tab 同构单元（icon+label）；返回 = 层级 pop -->
		{#if secondaryItems && !collapsed && !secPopped}
			<div
				class="secondary-nav"
				bind:this={secEl}
				role="tablist"
				aria-label="{activeTab?.label}二级导航"
				in:fly={{ y: 12, duration: prefersReducedMotion() ? 0 : 240 }}
				out:fly={{ duration: prefersReducedMotion() ? 0 : 150, y: 12 }}
				onpointerdown={secPointerDown}
				onpointermove={secPointerMove}
				onpointerup={secPointerUp}
				onpointercancel={secPointerCancel}
				onclickcapture={secClickCapture}
			>
				<button
					class="sec-back"
					class:hidden={atLanding}
					onclick={popToPrimary}
					aria-label="返回上一级菜单"
					title="返回上一级菜单"
					draggable="false"
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
						<line x1="19" y1="12" x2="7" y2="12" />
						<polyline points="12 5 5 12 12 19" />
					</svg>
				</button>
				<span class="sec-divider" class:hidden={atLanding} aria-hidden="true"></span>
				{#each secondaryItems as c, i (c.href)}
					<a
						href={resolve(c.href as '/')}
						class="sec-item tab-sec"
						class:cur={i === secCur}
						aria-current={i === secCur ? 'page' : undefined}
						draggable="false"
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
							<path d={c.icon} />
						</svg>
						<span>{c.label}</span>
					</a>
				{/each}
			</div>
		{/if}
		{#if collapsed}
			<button
				class="nav-mini"
				transition:fade={{ duration: prefersReducedMotion() ? 0 : 160 }}
				onpointerenter={poke}
				onclick={poke}
				aria-label="展开导航"
			></button>
		{:else}
			<div
				class="nav-inner"
				bind:this={navEl}
				role="tablist"
				aria-label="主导航"
				tabindex="-1"
				onpointerdown={onPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onpointercancel={onPointerCancel}
				onclickcapture={onClickCapture}
			>
				<!-- 滑块（玻璃凸块）：随 active tab 平移；拖拽中跟手（无过渡）；z-0 在 tab 内容之下 -->
				<div
					class="nav-slider"
					class:ready={activeIndex >= 0}
					class:dragging={dragPos !== null}
					bind:this={sliderEl}
					style="--slider-index:{sliderIndex}; --slider-count:{TABS.length};"
					aria-hidden="true"
				></div>
				{#each TABS as item (item.href)}
					{@const active = isActive(item)}
					<a
						href={resolve(item.href as '/')}
						class="tab"
						class:active
						aria-current={active ? 'page' : undefined}
						draggable="false"
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
		{/if}
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

	/* 闲置白条：120×10 把手条，悬浮/触碰展开 */
	.nav-mini {
		pointer-events: auto;
		width: 120px;
		height: 10px;
		margin-bottom: 22px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-ink) 3%);
		border: 1px solid var(--color-line-regular);
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			0 3px 14px rgb(0 0 0 / 0.2);
		cursor: pointer;
		padding: 0;
		align-self: end;
		transition:
			box-shadow 160ms var(--ease-out),
			transform 160ms var(--ease-out);
	}

	.nav-mini:hover {
		transform: scaleY(1.35);
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			0 4px 18px rgb(0 0 0 / 0.26);
	}

	/* ═══ 3D 液态玻璃胶囊 ═══
	   磨砂基底（blur+saturate+grain）+ 三层立体光影：顶缘镜面高光 /
	   底缘内暗边（厚度）/ 悬浮投影（脱离感）；::before 沿顶缘的
	   液态高光带让玻璃「湿润」。
	   透度关键：底色 alpha 压到 ~0.55，让方格衬底与页面内容真实
	   透过磨砂层（否则半透明退化为纯色板）。 */
	.nav-inner {
		pointer-events: auto;
		position: relative;
		display: flex;
		align-items: stretch;
		gap: 4px;
		width: 100%;
		max-width: 100%; /* 数值型，供折叠动画 100%→46px 过渡 */
		background: color-mix(in srgb, var(--color-surface) 46%, transparent);
		border-top: 1px solid var(--color-line-hair);
		-webkit-backdrop-filter: blur(14px) saturate(1.7);
		backdrop-filter: blur(14px) saturate(1.7);
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			inset 0 -1px 0 rgb(0 0 0 / 0.06);
		animation: nav-enter 420ms var(--ease-out) both;
		transition:
			max-width 340ms var(--ease-out),
			min-height 340ms var(--ease-out),
			border-radius 340ms var(--ease-out),
			margin 340ms var(--ease-out),
			box-shadow 340ms var(--ease-out);
		overflow: hidden;
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
			transition: none;
		}

		.secondary-nav {
			transition: none;
		}
	}

	/* 桌面 ≥768px：居中悬浮胶囊（完全体 3D 玻璃） */
	@media (min-width: 768px) {
		.nav-inner {
			width: auto;
			max-width: 640px; /* 数值上限供折叠动画过渡 */
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

	/* ═══ 二级导航条：从主导航上方弹出的同款玻璃小胶囊 ═══ */
	.secondary-nav {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 5px 7px;
		background: color-mix(in srgb, var(--color-surface) 60%, transparent);
		border: 1px solid var(--color-line-regular);
		border-radius: 999px;
		-webkit-backdrop-filter: blur(14px) saturate(1.7);
		backdrop-filter: blur(14px) saturate(1.7);
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			0 10px 30px rgb(0 0 0 / 0.14);
		pointer-events: auto;
		white-space: nowrap;
		touch-action: pan-y;
		user-select: none;
		-webkit-user-select: none;
		margin-bottom: 12px; /* 与一级胶囊垂直同心（66 高中点对齐） */
	}

	.sec-back {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: 999px;
		color: var(--color-ink-2);
		text-decoration: none;
		flex-shrink: 0;
		transition:
			color 140ms var(--ease-out),
			background-color 140ms var(--ease-out);
	}

	.sec-back:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 8%, transparent);
	}

	.sec-back svg {
		width: 16px;
		height: 16px;
	}

	.sec-back.hidden,
	.sec-divider.hidden {
		display: none;
	}

	.sec-divider {
		width: 1px;
		height: 16px;
		background: var(--color-line-hair);
		margin: 0 4px;
		flex-shrink: 0;
	}

	/* sec-item：与一级 .tab 同构的单元（icon+label 纵排小号变体）——单点维护 */
	.sec-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: 5px 13px;
		border-radius: 12px;
		font-size: 10.5px;
		line-height: 1;
		color: var(--color-ink-2);
		text-decoration: none;
		transition:
			color 140ms var(--ease-out),
			background-color 140ms var(--ease-out),
			transform 140ms var(--ease-out);
	}

	.sec-item svg {
		width: 17px;
		height: 17px;
		transition: transform 140ms var(--ease-out);
	}

	.sec-item:hover {
		color: var(--color-ink);
	}

	.sec-item:hover svg {
		transform: translateY(-1px) scale(1.06);
	}

	.sec-item:active {
		transform: scale(0.94);
	}

	/* 当前子页 / 拖拽跟随项：琥珀凸块语义（与主导航滑块一致） */
	.sec-item.cur {
		color: var(--color-accent-text);
		font-weight: 600;
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
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
		min-width: 74px; /* 左右留白加宽（原 58px，拖拽热区更从容） */
		padding: 4px 18px;
		border-radius: 14px;
		font-size: 10px;
		line-height: 1;
		color: var(--color-ink-2);
		text-decoration: none;
		touch-action: pan-y; /* 水平拖拽归滑切，垂直滚动不拦截 */
		user-select: none;
		-webkit-user-select: none;
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
	}

	.tab:hover svg {
		transform: translateY(-1px) scale(1.06);
	}

	/* ═══ 滑块（玻璃凸块）═══
	   绝对定位在 nav 底层，按 --slider-index 平移；激活凸起的光影
	   全部由滑块承担（tab 本体只变色），滑动 = transform 过渡。
	   初始（ready 前）隐藏，避免首帧从 0 位滑入的跳变；
	   拖拽中（dragging）关闭过渡 → 跟手。 */
	.nav-slider {
		position: absolute;
		top: 4px;
		bottom: 4px;
		left: 4px;
		width: calc((100% - 8px) / var(--slider-count));
		border-radius: 14px;
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.22),
			0 2px 8px color-mix(in srgb, var(--color-accent) 26%, transparent);
		transform: translateX(calc(100% * var(--slider-index)));
		transition: transform 320ms var(--ease-out);
		opacity: 0;
		pointer-events: none;
	}

	.nav-slider.dragging {
		transition: none;
		/* 拖拽中轻微放大 + 光晕增强：玻璃被「捏住」的手感 */
		scale: 1.05;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.28),
			0 4px 16px color-mix(in srgb, var(--color-accent) 36%, transparent);
	}

	.nav-slider.ready {
		opacity: 1;
	}

	/* 激活态：凸块光影由滑块承担，tab 只负责文字/图标状态 */
	.tab.active {
		color: var(--color-accent-text);
		font-weight: 600;
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

		.nav-slider {
			border-radius: 12px 12px 0 0;
		}
	}
</style>

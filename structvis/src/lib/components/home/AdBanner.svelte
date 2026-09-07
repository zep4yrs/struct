<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { base } from '$app/paths';
	import { fade } from 'svelte/transition';

	/**
	 * 公益广告位（首页顶部）：腾讯志愿者 404 计划真实专题大图轮播。
	 * 布局参数沿用 BankSystem hero-ad（用户验收过的成熟设计）：
	 * 380px 大图、slide 交叉带 26px 滑动、双向 scrim、左下毛玻璃 tag 信息区。
	 * 数据：static/ads/psa.json（官方 CDN feed 聚合，宝贝回家优先，构建/手动更新）。
	 */
	interface PsaItem {
		id: string;
		tag: string;
		title: string;
		desc: string;
		link: string;
		img: string;
	}

	const DISMISS_KEY = 'structvis:ad:dismissed';
	const AD_ID = 'tencent404';

	let dismissed = $state(false);
	let items = $state<PsaItem[]>([]);
	let cur = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	function prefersReduced(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function todayStr(): string {
		return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
	}

	onMount(async () => {
		try {
			dismissed = localStorage.getItem(DISMISS_KEY) === `${AD_ID}:${todayStr()}`;
		} catch {
			dismissed = false;
		}
		try {
			const res = await fetch(`${base}/ads/psa.json`);
			if (res.ok) items = (await res.json()).items ?? [];
		} catch {
			/* 静态资源缺失时静默降级 */
		}
		if (!items.length || prefersReduced()) return;
		timer = setInterval(() => {
			cur = (cur + 1) % items.length;
		}, 6000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	function dismiss(): void {
		dismissed = true;
		if (timer) clearInterval(timer);
		try {
			localStorage.setItem(DISMISS_KEY, `${AD_ID}:${todayStr()}`);
		} catch {
			/* 隐私模式忽略 */
		}
	}
</script>

{#if !dismissed && items.length}
	<div class="ad-card" transition:fade={{ duration: prefersReduced() ? 0 : 180 }}>
		<div class="slides">
			{#each items as it, i (it.id)}
				<!-- svelte-ignore svelte/no-navigation-without-resolve -->
				<a
					class="slide"
					class:on={i === cur}
					href={it.link}
					target="_blank"
					rel="noopener noreferrer"
					draggable="false"
				>
					<img src={it.img} alt="{it.tag} · {it.title}" loading={i === 0 ? 'eager' : 'lazy'} />
					<div class="scrim"></div>
					<div class="s-info">
						<span class="tag">{it.tag}</span>
						<span class="nm">{it.title}</span>
						<span class="ds">{it.desc}</span>
					</div>
				</a>
			{/each}
		</div>
		<div class="ad-dots" role="tablist" aria-label="公益专题切换">
			{#each items as _, i (i)}
				<button
					class="dot"
					class:on={i === cur}
					aria-label="第 {i + 1} 个专题"
					tabindex="-1"
					onclick={(e) => {
						e.preventDefault();
						cur = i;
					}}
				></button>
			{/each}
		</div>
		<button class="ad-close" aria-label="关闭公益广告" title="关闭公益广告" onclick={dismiss}
			>✕</button
		>
	</div>
{/if}

<style>
	/* ═══ 公益广告位：BankSystem hero-ad 同款布局（380px 大图轮播） ═══ */
	.ad-card {
		position: relative;
		display: block;
		margin-bottom: 24px;
		overflow: hidden;
		border-radius: 20px;
		background: linear-gradient(165deg, rgba(255, 206, 150, 0.24), rgba(255, 178, 110, 0.14));
		border: 1px solid rgba(255, 205, 160, 0.6);
		box-shadow: 0 14px 40px rgba(20, 60, 60, 0.1);
	}

	.slides {
		position: relative;
		height: 380px;
	}

	.slide {
		position: absolute;
		inset: 0;
		opacity: 0;
		transform: translateX(26px);
		transition:
			opacity 0.55s var(--ease-out),
			transform 0.55s var(--ease-out);
		pointer-events: none;
	}

	.slide.on {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	.slide img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	/* 双向 scrim：垂直下压 + 水平左压（文字区可读） */
	.scrim {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(25, 18, 6, 0.02) 34%, rgba(25, 18, 6, 0.62) 100%),
			linear-gradient(90deg, rgba(25, 18, 6, 0.34), rgba(25, 18, 6, 0) 46%);
	}

	.s-info {
		position: absolute;
		left: 34px;
		bottom: 30px;
		right: 200px;
		color: #fff;
		max-width: 76%;
	}

	.tag {
		display: inline-block;
		font-size: 11px;
		padding: 3px 12px;
		border-radius: 99px;
		background: rgba(255, 255, 255, 0.22);
		backdrop-filter: blur(8px);
		letter-spacing: 0.1em;
		margin-bottom: 10px;
	}

	.nm {
		display: block;
		font-size: 26px;
		font-weight: 800;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 10px rgb(0 0 0 / 0.35);
	}

	.ds {
		display: block;
		margin-top: 6px;
		font-size: 14px;
		opacity: 0.92;
		text-shadow: 0 1px 6px rgb(0 0 0 / 0.4);
	}

	.ad-dots {
		position: absolute;
		right: 22px;
		bottom: 22px;
		display: flex;
		gap: 7px;
		z-index: 2;
	}

	.dot {
		width: 9px;
		height: 9px;
		padding: 0;
		border: none;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.42);
		cursor: pointer;
		transition:
			background-color 140ms var(--ease-out),
			transform 140ms var(--ease-spring);
	}

	.dot.on {
		background: #fff;
		transform: scale(1.2);
	}

	.ad-close {
		position: absolute;
		top: 14px;
		right: 14px;
		z-index: 3;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.3);
		color: #fff;
		font-size: 12px;
		cursor: pointer;
		backdrop-filter: blur(6px);
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-spring);
	}

	.ad-close:hover {
		background: rgb(0 0 0 / 0.5);
		transform: scale(1.08);
	}

	@media (prefers-reduced-motion: reduce) {
		.slide {
			transition: none;
			transform: none;
		}
	}

	@media (max-width: 767px) {
		.slides {
			height: 300px;
		}

		.s-info {
			left: 22px;
			bottom: 20px;
			right: 90px;
			max-width: none;
		}

		.nm {
			font-size: 20px;
		}

		.ds {
			font-size: 12.5px;
		}
	}
</style>

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

	onMount(async () => {
		try {
			// ✕ = 本次会话免打扰（sessionStorage）；不再全天屏蔽——
			// 全天版曾被误读为“广告消失”，且旧行为对新访客无自愈能力
			dismissed = sessionStorage.getItem(DISMISS_KEY) === AD_ID;
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
			sessionStorage.setItem(DISMISS_KEY, AD_ID);
		} catch {
			/* 隐私模式忽略 */
		}
	}
</script>

{#if !dismissed && items.length}
	<div class="ad-card" transition:fade={{ duration: prefersReduced() ? 0 : 180 }}>
		<div class="slides">
			{#each items as it, i (it.id)}
				<button
					class="slide"
					class:on={i === cur}
					onclick={() => window.open(it.link, '_blank', 'noopener')}
					aria-label="{it.tag}：{it.title}（打开专题页面）"
				>
					<img src={it.img} alt="{it.tag} · {it.title}" loading={i === 0 ? 'eager' : 'lazy'} />
					<div class="s-info">
						<span class="ad-tag">{it.tag}</span>
						<span class="nm">{it.title}</span>
						<span class="ds">{it.desc}</span>
					</div>
				</button>
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
	/* ═══ 公益广告位：推挤式轮播（新张从右推入盖住旧张，一镜到底连续方向） ═══ */
	.ad-card {
		position: relative;
		display: block;
		width: min(608px, 100%); /* 高度不变（380），宽度收至 16:10 */
		margin: 0 auto 24px;
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

	/* 单张专题：官方插画整幅 + 左下信息区（毛玻璃 tag / 大标题 / 描述） */
	.slide {
		position: absolute;
		inset: 0;
		opacity: 0;
		transform: translateX(64px);
		transition:
			transform 620ms var(--ease-out),
			opacity 620ms var(--ease-out);
		pointer-events: none;
	}

	.slide.on {
		opacity: 1;
		transform: translateX(0);
	}

	.slide img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.slide::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(15, 20, 28, 0.05) 30%, rgba(15, 20, 28, 0.66) 100%);
	}

	.s-info {
		position: absolute;
		left: 40px;
		bottom: 28px;
		right: 200px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		z-index: 1;
	}

	.ad-tag {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		color: #f5c96b;
		border: 1px solid color-mix(in srgb, #f5c96b 45%, transparent);
		border-radius: 999px;
		padding: 3px 12px;
		background: rgb(0 0 0 / 0.3);
	}

	.nm {
		font-family: var(--font-display);
		font-size: 30px;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: #faf9f6;
		text-shadow: 0 2px 12px rgb(0 0 0 / 0.45);
	}

	.ds {
		font-size: 15px;
		color: #d8e2ea;
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
			transform: none;
			transition: none;
		}
	}

	@media (max-width: 767px) {
		.slides {
			height: 240px;
		}

		.s-info {
			left: 18px;
			right: 76px;
			bottom: 16px;
		}

		.nm {
			font-size: 20px;
		}

		.ds {
			font-size: 13px;
		}
	}
</style>

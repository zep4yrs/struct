<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { base } from '$app/paths';
	import { fade } from 'svelte/transition';

	/**
	 * 图片式公益广告位（首页顶部）：宝贝回家真实寻亲个案轮播。
	 * - 数据：static/ads/missing.json（宝贝回家官方 API 公开寻亲信息，标注来源与官网链接）
	 * - 照片大图同位淡切轮播（6s 自动）+ 圆点切换；右上角可关闭（当日记忆）
	 * - reduced-motion 不自动轮播；点击卡片打开宝贝回家官网
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
	const AD_ID = 'baobeihuijia';

	let dismissed = $state(false);
	let items = $state<PsaItem[]>([]);
	let cur = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	function todayStr(): string {
		return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
	}

	function prefersReduced(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function dismiss(): void {
		dismissed = true;
		if (timer) clearInterval(timer);
		try {
			localStorage.setItem(DISMISS_KEY, `${AD_ID}:${todayStr()}`);
		} catch {
			/* 隐私模式忽略 */
		}
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
</script>

{#if !dismissed && items.length}
	<div class="ad-card" transition:fade={{ duration: prefersReduced() ? 0 : 180 }}>
		<a
			class="ad-media"
			href="https://www.baobeihuijia.com"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="公益广告：宝贝回家寻亲信息（点击打开宝贝回家官网）"
		>
			{#each items as it, i (it.id)}
				<div class="slide" class:on={i === cur}>
					<img src={it.img} alt={it.title} loading={i === 0 ? 'eager' : 'lazy'} />
					<div class="slide-info">
						<span class="ad-tag">{it.tag}</span>
						<span class="slide-name">{it.title}</span>
						<span class="slide-meta">{it.desc}</span>
					</div>
				</div>
			{/each}
			<div class="ad-brand">腾讯志愿者 · 404 计划</div>
			<div class="ad-dots" role="tablist" aria-label="寻亲个案切换">
				{#each items as _, i (i)}
					<button
						class="dot"
						class:on={i === cur}
						aria-label="第 {i + 1} 条"
						tabindex="-1"
						onclick={(e) => {
							e.preventDefault();
							cur = i;
						}}
					></button>
				{/each}
			</div>
		</a>
		<button class="ad-close" aria-label="关闭公益广告" title="关闭公益广告" onclick={dismiss}
			>✕</button
		>
	</div>
{/if}

<style>
	.ad-card {
		position: relative;
		display: block;
		margin-bottom: 24px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--color-line-hair);
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			0 10px 34px rgb(0 0 0 / 0.16);
	}

	.ad-media {
		display: block;
		position: relative;
		text-decoration: none;
		aspect-ratio: 1040 / 240;
	}

	/* 幻灯堆叠：同位淡切（一镜到底） */
	.slide {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 600ms var(--ease-out);
	}

	.slide.on {
		opacity: 1;
	}

	.slide {
		display: flex;
		align-items: stretch;
		background: #0b1f33;
	}

	/* 照片完整展示（contain，白衬底），任意比例不失真 */
	.slide img {
		height: 100%;
		width: auto;
		max-width: 38%;
		object-fit: cover;
		object-position: center top;
		display: block;
		flex-shrink: 0;
	}

	.slide::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			rgb(8 24 40 / 0.85) 0%,
			rgb(8 24 40 / 0.15) 55%,
			transparent 100%
		);
		pointer-events: none;
	}

	.slide-info {
		position: absolute;
		left: 42%;
		right: 24px;
		bottom: 18px;
		display: flex;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
		z-index: 1;
	}

	.ad-tag {
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.1em;
		color: #f5c96b;
		border: 1px solid color-mix(in srgb, #f5c96b 45%, transparent);
		border-radius: 999px;
		padding: 2px 9px;
		background: rgb(0 0 0 / 0.25);
	}

	.slide-name {
		font-family: var(--font-display);
		font-size: 24px;
		font-weight: 600;
		color: #faf9f6;
		text-shadow: 0 2px 8px rgb(0 0 0 / 0.5);
	}

	.slide-meta {
		font-size: 12.5px;
		color: #d8e2ea;
		text-shadow: 0 1px 6px rgb(0 0 0 / 0.5);
	}

	.ad-brand {
		position: absolute;
		top: 12px;
		left: 16px;
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		color: rgb(255 255 255 / 0.75);
		text-shadow: 0 1px 4px rgb(0 0 0 / 0.4);
	}

	.ad-dots {
		position: absolute;
		right: 16px;
		bottom: 14px;
		display: flex;
		gap: 7px;
		z-index: 1;
	}

	.dot {
		width: 8px;
		height: 8px;
		padding: 0;
		border: none;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.4);
		cursor: pointer;
		transition:
			background-color 140ms var(--ease-out),
			transform 140ms var(--ease-spring);
	}

	.dot.on {
		background: #f5c96b;
		transform: scale(1.25);
	}

	.ad-close {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 2;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.3);
		color: #fff;
		font-size: 12px;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-spring);
	}

	.ad-close:hover {
		background: rgb(0 0 0 / 0.5);
		transform: scale(1.08);
	}
</style>

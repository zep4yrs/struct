<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	/**
	 * 公益广告位（首页顶部横幅）：宝贝回家（baobeihuijia.com）寻亲公益。
	 * 关闭后当日不再显示（次日自动回归），状态存 localStorage；reduced-motion 直切。
	 */
	const DISMISS_KEY = 'structvis:ad:dismissed';
	const AD_ID = 'baobeihuijia';

	let dismissed = $state(false);

	function todayStr(): string {
		return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
	}

	function prefersReduced(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	onMount(() => {
		try {
			dismissed = localStorage.getItem(DISMISS_KEY) === `${AD_ID}:${todayStr()}`;
		} catch {
			dismissed = false;
		}
	});

	function dismiss(): void {
		dismissed = true;
		try {
			localStorage.setItem(DISMISS_KEY, `${AD_ID}:${todayStr()}`);
		} catch {
			/* 隐私模式忽略 */
		}
	}
</script>

{#if !dismissed}
	<aside
		class="ad-banner"
		role="complementary"
		aria-label="公益广告：宝贝回家"
		transition:fade={{ duration: prefersReduced() ? 0 : 180 }}
	>
		<span class="ad-tag">公益 · 宝贝回家</span>
		<p class="ad-text">每一个转发的寻亲信息，都是一个家庭团圆的可能——帮失踪的孩子找到回家的路。</p>
		<a
			class="ad-link"
			href="https://www.baobeihuijia.com"
			target="_blank"
			rel="noopener noreferrer"
		>
			去了解 →
		</a>
		<button class="ad-close" aria-label="关闭公益广告" onclick={dismiss}>✕</button>
	</aside>
{/if}

<style>
	.ad-banner {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 22px;
		padding: 12px 16px;
		border: 1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-line-hair));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-surface) 60%, transparent);
	}

	.ad-tag {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.1em;
		color: var(--color-accent-text);
		border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
		border-radius: 999px;
		padding: 2px 9px;
	}

	.ad-text {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-ink-2);
	}

	.ad-link {
		flex-shrink: 0;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--color-accent-text);
		text-decoration: none;
		transition: opacity 120ms var(--ease-out);
	}

	.ad-link:hover {
		opacity: 0.75;
	}

	.ad-close {
		margin-left: auto;
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		border-radius: 8px;
		color: var(--color-ink-3);
		font-size: 12px;
		cursor: pointer;
		transition:
			color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.ad-close:hover {
		color: var(--color-ink);
		background: var(--color-subtle);
	}

	@media (max-width: 640px) {
		.ad-banner {
			flex-wrap: wrap;
			gap: 8px;
		}

		.ad-text {
			flex-basis: 100%;
			order: 3;
		}

		.ad-link {
			order: 4;
		}
	}
</style>

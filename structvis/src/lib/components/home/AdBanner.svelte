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
	<div class="ad-card" transition:fade={{ duration: prefersReduced() ? 0 : 180 }}>
		<a
			class="ad-media"
			href="https://www.baobeihuijia.com"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="公益广告：宝贝回家——帮失踪的孩子找到回家的路（打开宝贝回家官网）"
		>
			<svg
				viewBox="0 0 1040 240"
				preserveAspectRatio="xMidYMid slice"
				role="img"
				aria-hidden="true"
			>
				<defs>
					<linearGradient id="ad-sky" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stop-color="#0f2b46" />
						<stop offset="0.62" stop-color="#1b4965" />
						<stop offset="1" stop-color="#2d6a7e" />
					</linearGradient>
					<radialGradient id="ad-glow" cx="0.78" cy="0.42" r="0.5">
						<stop offset="0" stop-color="#f5c96b" stop-opacity="0.55" />
						<stop offset="1" stop-color="#f5c96b" stop-opacity="0" />
					</radialGradient>
				</defs>
				<rect width="1040" height="240" fill="url(#ad-sky)" />
				<circle cx="812" cy="86" r="150" fill="url(#ad-glow)" />
				<path
					d="M60 190 C 220 130, 380 210, 560 140 S 860 60, 940 96"
					stroke="#f5c96b"
					stroke-width="2.5"
					stroke-dasharray="2 10"
					stroke-linecap="round"
					fill="none"
					opacity="0.8"
				/>
				<g fill="#0b1f33">
					<circle cx="700" cy="98" r="13" />
					<path
						d="M700 112 c-12 0 -19 10 -19 26 l6 44 h9 l2 -30 3 0 2 30 h9 l6 -44 c0 -16 -7 -26 -18 -26 z"
					/>
					<circle cx="756" cy="112" r="9" />
					<path
						d="M756 123 c-9 0 -14 8 -14 20 l5 33 h7 l1 -22 2 0 1 22 h7 l5 -33 c0 -12 -5 -20 -13 -20 z"
					/>
				</g>
				<g>
					<path
						d="M905 96 l30 -24 30 24 v42 a6 6 0 0 1 -6 6 h-48 a6 6 0 0 1 -6 -6 z"
						fill="#f5c96b"
						opacity="0.92"
					/>
					<rect x="928" y="112" width="14" height="32" rx="2" fill="#0f2b46" />
				</g>
				<text
					x="52"
					y="84"
					fill="#f5c96b"
					font-family="Georgia, 'Noto Serif SC', serif"
					font-size="15"
					letter-spacing="6"
					opacity="0.9">公 益 · 宝 贝 回 家</text
				>
				<text
					x="50"
					y="136"
					fill="#faf9f6"
					font-family="Georgia, 'Noto Serif SC', serif"
					font-size="42"
					font-weight="600"
					letter-spacing="2">宝贝回家</text
				>
				<text
					x="52"
					y="176"
					fill="#c9d6df"
					font-family="'PingFang SC', 'Microsoft YaHei', sans-serif"
					font-size="17">每一个转发的寻亲信息，都是一个家庭团圆的可能</text
				>
				<text
					x="52"
					y="206"
					fill="#7fa3bd"
					font-family="Consolas, monospace"
					font-size="13"
					letter-spacing="1">baobeihuijia.com</text
				>
				<g>
					<rect x="876" y="188" width="112" height="30" rx="15" fill="#f5a623" />
					<text
						x="932"
						y="208"
						text-anchor="middle"
						fill="#0f2b46"
						font-family="'PingFang SC', 'Microsoft YaHei', sans-serif"
						font-size="14"
						font-weight="600">去帮一把 ↗</text
					>
				</g>
			</svg>
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
		text-decoration: none;
	}

	.ad-media :global(svg) {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 1040 / 240;
		object-fit: cover;
	}

	.ad-close {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.28);
		color: #fff;
		font-size: 12px;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition:
			background-color 120ms var(--ease-out),
			transform 120ms var(--ease-spring);
	}

	.ad-close:hover {
		background: rgb(0 0 0 / 0.45);
		transform: scale(1.08);
	}
</style>

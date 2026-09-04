<script lang="ts">
	import { endThemeVeil, settleThemeVeil, themeVeil } from '$lib/stores/settings';

	/**
	 * 主题切换遮罩动画（狼人杀梗）：
	 * 圆形遮罩从中心展开覆盖屏幕 → 遮盖瞬间落主题 → 日/月蚀变 morph + 字幕
	 * 「天黑请闭眼」/「天亮请睁眼」→ 遮罩淡出揭幕新主题。
	 * 触发源 toggleTheme 已旁路 reduced-motion / webdriver / 单测，此处只管播。
	 */
	let active = $state(false);
	let toDark = $state(true);

	let bgEl: HTMLDivElement | undefined = $state();
	let sunDisc: SVGCircleElement | undefined = $state(); // 琥珀日轮
	let moonDisc: SVGCircleElement | undefined = $state(); // 银白月轮
	let bite: SVGCircleElement | undefined = $state(); // 咬出月牙的遮罩圆
	let rays: SVGGElement | undefined = $state(); // 日光线
	let caption: HTMLParagraphElement | undefined = $state();

	const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

	$effect(() => {
		const d = $themeVeil;
		if (d === 'idle') return;
		run(d === 'to-dark');
	});

	async function run(dark: boolean) {
		toDark = dark;
		active = true;
		const veilColor = dark ? '#161514' : '#faf9f6';
		if (bgEl) bgEl.style.background = veilColor;
		const captionColor = dark ? '#e9e6e0' : '#1a1a1a';
		if (caption) caption.style.color = captionColor;

		// ── 1. 圆形遮罩展开盖屏 ──
		const clip = bgEl?.animate(
			[{ clipPath: 'circle(0% at 50% 42%)' }, { clipPath: 'circle(142% at 50% 42%)' }],
			{ duration: 520, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }
		);
		if (clip) await clip.finished.catch(() => {});

		// ── 2. 全盖瞬间落主题（揭幕即新主题） ──
		settleThemeVeil(dark ? 'dark' : 'light');

		// ── 3. 日⇄月蚀变 + 字幕 ──
		const ease = 'cubic-bezier(.6,0,.3,1)';
		const opt = { duration: 950, easing: ease, fill: 'forwards' } as const;
		if (bite) {
			// 咬入（日→月）或退离（月→日）
			bite.animate(
				dark
					? [{ transform: 'translate(84px,-58px)' }, { transform: 'translate(0,0)' }]
					: [{ transform: 'translate(0,0)' }, { transform: 'translate(84px,-58px)' }],
				opt
			);
		}
		if (rays) {
			rays.animate(
				dark
					? [
							{ opacity: 1, transform: 'rotate(0deg) scale(1)' },
							{ opacity: 0, transform: 'rotate(50deg) scale(0.35)' }
						]
					: [
							{ opacity: 0, transform: 'rotate(50deg) scale(0.35)' },
							{ opacity: 1, transform: 'rotate(0deg) scale(1)' }
						],
				opt
			);
		}
		if (sunDisc && moonDisc) {
			sunDisc.animate([{ opacity: dark ? 1 : 0 }, { opacity: dark ? 0 : 1 }], opt);
			moonDisc.animate([{ opacity: dark ? 0 : 1 }, { opacity: dark ? 1 : 0 }], opt);
		}
		if (caption) {
			caption.animate(
				[
					{ opacity: 0, transform: 'translateY(10px)', letterSpacing: '0.62em' },
					{ opacity: 1, transform: 'translateY(0)', letterSpacing: '0.22em' }
				],
				{ duration: 800, delay: 180, easing: ease, fill: 'forwards' }
			);
		}
		await wait(1450);

		// ── 4. 遮罩淡出揭幕 ──
		const fade = bgEl?.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 430,
			easing: 'ease-out',
			fill: 'forwards'
		});
		if (fade) await fade.finished.catch(() => {});

		active = false;
		// 复位 WAAPI fill 残留
		if (bgEl) {
			bgEl.getAnimations().forEach((a) => a.cancel());
			bgEl.style.background = 'transparent';
		}
		endThemeVeil();
	}
</script>

{#if active}
	<div class="theme-veil" aria-hidden="true">
		<div class="veil-bg" bind:this={bgEl}></div>
		<div class="veil-stage">
			<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<mask id="veil-bite-mask">
						<rect x="0" y="0" width="120" height="120" fill="white" />
						<circle
							bind:this={bite}
							cx="82"
							cy="40"
							r="36"
							fill="black"
							style="transform-box: fill-box; transform-origin: center;"
						/>
					</mask>
				</defs>
				<g
					bind:this={rays}
					stroke={toDark ? '#f5a623' : '#d97706'}
					stroke-width="4.5"
					stroke-linecap="round"
					style="transform-box: fill-box; transform-origin: center;"
				>
					<line x1="60" y1="8" x2="60" y2="20" />
					<line x1="60" y1="100" x2="60" y2="112" />
					<line x1="8" y1="60" x2="20" y2="60" />
					<line x1="100" y1="60" x2="112" y2="60" />
					<line x1="23" y1="23" x2="31.5" y2="31.5" />
					<line x1="88.5" y1="88.5" x2="97" y2="97" />
					<line x1="23" y1="97" x2="31.5" y2="88.5" />
					<line x1="88.5" y1="31.5" x2="97" y2="23" />
				</g>
				<circle
					bind:this={sunDisc}
					cx="60"
					cy="60"
					r="30"
					fill={toDark ? '#f5a623' : '#d97706'}
					mask="url(#veil-bite-mask)"
				/>
				<circle
					bind:this={moonDisc}
					cx="60"
					cy="60"
					r="30"
					fill="#e9e6e0"
					mask="url(#veil-bite-mask)"
				/>
			</svg>
			<p class="veil-caption" bind:this={caption}>
				{toDark ? '天黑请闭眼' : '天亮请睁眼'}
			</p>
		</div>
	</div>
{/if}

<style>
	.theme-veil {
		position: fixed;
		inset: 0;
		z-index: 10001; /* 高于开屏 9999 与 fab 60 */
		pointer-events: all; /* 动画期吞点击防重复触发 */
	}

	.veil-bg {
		position: absolute;
		inset: 0;
		background: transparent;
		will-change: clip-path, opacity;
	}

	.veil-stage {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 26px;
		pointer-events: none;
	}

	.veil-stage svg {
		width: 132px;
		height: 132px;
		overflow: visible;
		filter: drop-shadow(0 4px 22px rgb(0 0 0 / 0.25));
	}

	.veil-caption {
		font-family: var(--font-display);
		font-size: clamp(20px, 2.6vw, 30px);
		font-weight: 600;
		letter-spacing: 0.22em;
		margin: 0 0 0 0.22em; /* 抵消尾字间距，保持视觉居中 */
		opacity: 0;
		text-shadow: 0 2px 18px rgb(0 0 0 / 0.18);
	}
</style>

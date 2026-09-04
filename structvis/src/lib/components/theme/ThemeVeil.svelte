<script lang="ts">
	import { endThemeVeil, settleThemeVeil, themeVeil } from '$lib/stores/settings';

	/**
	 * 主题切换遮罩动画（狼人杀梗）：
	 * 反向聚光灯——屏幕中央留一个「洞」透出旧页面，洞随日⇄月蚀变同步收缩
	 * （夜幕/晨光从四周合拢），洞闭合的瞬间才落主题（变换发生在动画过程中，
	 * 旧内容已被遮没，无可见跳变）→ 字幕「天黑请闭眼/天亮请睁眼」→ 揭幕淡出。
	 * 触发源 toggleTheme 已旁路 reduced-motion / webdriver / 单测，此处只管播。
	 */
	let active = $state(false);
	let toDark = $state(true);

	let rootEl: HTMLDivElement | undefined = $state();
	let hole: HTMLDivElement | undefined = $state(); // 反向遮罩：洞外是 veil 色
	let sunDisc: SVGCircleElement | undefined = $state(); // 琥珀日轮
	let moonDisc: SVGCircleElement | undefined = $state(); // 银白月轮
	let bite: SVGCircleElement | undefined = $state(); // 咬出月牙的遮罩圆
	let rays: SVGGElement | undefined = $state(); // 日光线
	let caption: HTMLParagraphElement | undefined = $state();

	const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
	/** 洞最终收缩到的半径 = 图标聚焦圈 */
	const HOLE_FINAL_R = 118;

	$effect(() => {
		const d = $themeVeil;
		if (d === 'idle') return;
		run(d === 'to-dark');
	});

	async function run(dark: boolean) {
		toDark = dark;
		active = true;
		await wait(0); // 等 DOM 挂载
		const veilColor = dark ? '#161514' : '#faf9f6';
		if (caption) caption.style.color = dark ? '#e9e6e0' : '#1a1a1a';
		const R = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 40;
		if (hole) {
			hole.style.width = hole.style.height = `${R * 2}px`;
			hole.style.boxShadow = `0 0 0 200vmax ${veilColor}`;
		}

		const ease = 'cubic-bezier(.55,.06,.35,1)';
		const opt = { duration: 1150, easing: ease, fill: 'forwards' } as const;

		// ── 同步开始：洞收缩（日夜合拢）＋ 日⇄月蚀变 ＋ 字幕 ──
		const shrink = hole?.animate(
			[
				{ transform: 'translate(-50%,-50%) scale(1)' },
				{ transform: `translate(-50%,-50%) scale(${HOLE_FINAL_R / R})` }
			],
			opt
		);
		if (bite) {
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
				{ duration: 750, delay: 200, easing: ease, fill: 'forwards' }
			);
		}
		if (shrink) await shrink.finished.catch(() => {});

		// ── 洞收拢到图标圈后闭合并淡出 → 旧内容完全被遮没 → 此刻落主题 ──
		const close = hole?.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 130,
			easing: 'ease-in',
			fill: 'forwards'
		});
		if (close) await close.finished.catch(() => {});
		settleThemeVeil(dark ? 'dark' : 'light');

		// ── 图标+字幕停驻 ──
		await wait(1050);

		// ── 揭幕淡出 ──
		const fade = rootEl?.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 430,
			easing: 'ease-out',
			fill: 'forwards'
		});
		if (fade) await fade.finished.catch(() => {});

		active = false;
		hole?.getAnimations().forEach((a) => a.cancel());
		endThemeVeil();
	}
</script>

{#if active}
	<div class="theme-veil" bind:this={rootEl} aria-hidden="true">
		<div class="veil-hole" bind:this={hole}></div>
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
		overflow: hidden; /* 裁掉洞的巨大 box-shadow 视口外部分 */
		pointer-events: all; /* 动画期吞点击防重复触发 */
	}

	/* 反向聚光灯：中央圆孔透出旧页面，box-shadow 实心环 = 四周涌入的夜幕/晨光 */
	.veil-hole {
		position: absolute;
		left: 50%;
		top: 42%;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		will-change: transform, opacity;
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

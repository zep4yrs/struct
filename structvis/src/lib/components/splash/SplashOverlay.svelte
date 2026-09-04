<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { settings } from '$lib/stores/settings';

	interface Props {
		onfinished?: () => void;
	}

	let { onfinished = () => {} }: Props = $props();

	/* portal 到 body：开屏层必须以视口定位——页面切换容器（.page-transition）的
	   入场动画带 transform 终态，会把 fixed 后代的定位基准劫持为整个页面容器，
	   导致 splash 内容「居中到文档中部、要滚动才能看见」（与 CoachMarkLayer 同因） */
	function portalToBody(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	/* ── 门控（跳过条件） ── */
	let shown = $state(false);
	const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};
	const isAutomated =
		w.__DSH_NO_SCENE__ === '1' ||
		(typeof navigator !== 'undefined' &&
			(navigator as Navigator & { webdriver?: boolean }).webdriver === true);

	/* ── 标语/品牌常量 ── */
	const BRAND = 'StructVis';
	const TAGLINE = '看见数据结构与数据库的每一步跳动';

	/* ── 音效引擎（Web Audio 合成，零资源） ── */
	let actx: AudioContext | null = null;
	let timers: ReturnType<typeof setTimeout>[] = [];
	let stopped = false;

	function initAudio(): boolean {
		if (actx) return actx.state === 'running';
		if (!$settings.openingSound) return false;
		try {
			const AC =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			const ctx = new AC();
			actx = ctx;
			void ctx.resume();
			return ctx.state === 'running';
		} catch {
			actx = null;
			return false;
		}
	}

	function tone(freq: number, glide: number, dur: number, type: OscillatorType, vol: number) {
		if (!actx || actx.state !== 'running') return;
		const t0 = actx.currentTime;
		const o = actx.createOscillator();
		const g = actx.createGain();
		o.type = type;
		o.frequency.setValueAtTime(freq, t0);
		if (glide !== freq) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
		g.gain.setValueAtTime(0.0001, t0);
		g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
		g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		o.connect(g);
		g.connect(actx.destination);
		o.start(t0);
		o.stop(t0 + dur + 0.05);
	}

	function tickNoise(dur: number, vol: number) {
		if (!actx || actx.state !== 'running') return;
		const t0 = actx.currentTime;
		const len = Math.floor(actx.sampleRate * dur);
		const buf = actx.createBuffer(1, len, actx.sampleRate);
		const d = buf.getChannelData(0);
		for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
		const src = actx.createBufferSource();
		src.buffer = buf;
		const g = actx.createGain();
		g.gain.value = vol;
		src.connect(g);
		g.connect(actx.destination);
		src.start(t0);
	}

	const SFX = {
		snap: () => {
			tone(1500, 900, 0.07, 'sine', 0.09);
			tickNoise(0.03, 0.06);
		},
		ding: () => tone(880, 880, 0.13, 'triangle', 0.09),
		hop: () => {
			tone(660, 990, 0.12, 'triangle', 0.08);
			tickNoise(0.04, 0.03);
		},
		thump: () => {
			tone(440, 440, 0.42, 'sine', 0.13);
			tone(660, 660, 0.38, 'triangle', 0.06);
		},
		scatter: () => {
			tone(520, 160, 0.5, 'sine', 0.07);
			tickNoise(0.18, 0.04);
		},
		chime: () => tone(1320, 1480, 0.55, 'triangle', 0.09)
	};

	function later(fn: () => void, ms: number, sfx?: keyof typeof SFX) {
		const t = setTimeout(() => {
			if (stopped) return;
			if (sfx) SFX[sfx]();
			fn();
		}, ms);
		timers.push(t);
		return t;
	}

	/* ── 舞台元素引用 ── */
	let logoWrap = $state<HTMLDivElement>();
	let brandDot = $state<HTMLSpanElement>();
	let splashEl = $state<HTMLDivElement>();
	let skipShown = $state(false);

	/* 字母来向：中间先，左右对称展开 */
	const letterMeta = BRAND.split('').map((ch, i) => {
		const dist = Math.abs(i - 4) * 95 + 170;
		const dx = i < 4 ? -dist : dist;
		const order = 4 - Math.abs(i - 4);
		return {
			ch,
			dx,
			dx2: -dx * 0.14,
			dx3: dx * 0.05,
			dx4: -dx * 0.015,
			d: 2900 + (4 - order) * 120
		};
	});

	/* 标语字 */
	const taglineChars = TAGLINE.split('').map((ch, i) => ({
		ch: ch === ' ' ? '\u00A0' : ch,
		d: 3850 + i * 80
	}));

	function nodeHop(node: Element) {
		const el = node as HTMLElement;
		el.style.transition = 'transform .16s ease-out';
		el.style.transform = 'scale(1.5)';
		setTimeout(() => {
			el.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)';
			el.style.transform = 'scale(1)';
		}, 170);
	}

	function playSequence() {
		const nodes = Array.from(document.querySelectorAll('.sv-l-node'));
		[[660], [840], [1020], [1200]].forEach(([ms], i) => {
			later(
				() => {
					const n = nodes[i];
					if (n) setTimeout(() => nodeHop(n), 240);
				},
				ms,
				'ding'
			);
		});
		const tables = Array.from(document.querySelectorAll('.sv-r-table'));
		tables.forEach((t, i) => {
			later(
				() => {
					const line = t.querySelector('.sv-rowline') as SVGLineElement | null;
					if (line) {
						setTimeout(() => {
							line.style.transition = 'transform .28s cubic-bezier(.16,1,.3,1)';
							line.style.transform = 'scaleX(1)';
						}, 160);
					}
				},
				1460 + i * 180,
				'snap'
			);
		});
		later(
			() => {
				const lw = logoWrap;
				if (!lw) return;
				lw.style.transition = 'transform .2s ease-out';
				lw.style.transform = 'scale(1.06)';
				setTimeout(() => {
					lw.style.transition = 'transform .32s cubic-bezier(.34,1.56,.64,1)';
					lw.style.transform = 'scale(1)';
				}, 200);
			},
			2750,
			'thump'
		);
		later(
			() => {
				const dot = brandDot;
				if (!dot) return;
				dot.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1), opacity .4s';
				dot.style.transform = 'translate(0,0) scale(1)';
				dot.style.opacity = '1';
				setTimeout(() => nodeHop(dot), 250);
			},
			3720,
			'chime'
		);
		later(() => {
			/* 爆炸完成 → 整层淡出（让位） */
			if (!splashEl) return;
			splashEl.style.transition = 'opacity .7s ease';
			splashEl.style.opacity = '0';
		}, 6700);
		later(() => explode(), 6400);
		later(() => leave(), 7400);
	}

	function explode() {
		const parts = Array.from(document.querySelectorAll('.sv-part'));
		parts.forEach((pt) => {
			(pt as HTMLElement).style.animation = 'none';
			void (pt as HTMLElement).getBoundingClientRect();
			const el = pt as HTMLElement;
			const fx = parseFloat(el.style.getPropertyValue('--fx')) || 0;
			const fy = parseFloat(el.style.getPropertyValue('--fy')) || 0;
			let outX = -fx * 1.9;
			let outY = -fy * 1.9;
			if (Math.abs(outX) < 60) outX = outX > 0 ? 160 : -160;
			if (Math.abs(outY) < 60) outY = outY > 0 ? 160 : -160;
			el.style.transition = 'transform .8s cubic-bezier(.5,0,.75,.4), opacity .6s';
			el.style.transform = `translate(${outX}px,${outY}px) scale(.45) rotate(${outX > 0 ? 14 : -14}deg)`;
			el.style.opacity = '0';
		});
		const letters = Array.from(document.querySelectorAll('.sv-brand-letter'));
		letters.forEach((lt, i) => {
			const el = lt as HTMLElement;
			el.style.animation = 'none';
			void el.getBoundingClientRect();
			const base = (i - 4) * 110;
			const dx = base + (base >= 0 ? 200 : -200);
			const dy = ((i % 2) * 2 - 1) * (160 + Math.abs(i - 4) * 22);
			el.style.transition = `transform .75s cubic-bezier(.5,0,.75,.4), opacity .6s ${i * 16}ms`;
			el.style.transform = `translate(${dx}px,${dy}px) rotate(${(base > 0 ? 18 : -18) * 0.4}deg) scale(.5)`;
			el.style.opacity = '0';
		});
		const dot = brandDot;
		if (dot) {
			dot.style.transition = 'transform .55s cubic-bezier(.5,0,.75,.4), opacity .45s 90ms';
			dot.style.transform = 'translate(300px,-240px) scale(2)';
			dot.style.opacity = '0';
		}
		const tws = Array.from(document.querySelectorAll('.sv-tword'));
		tws.forEach((w, i) => {
			const el = w as HTMLElement;
			el.style.animation = 'none';
			void el.getBoundingClientRect();
			const dx = ((i % 5) - 2) * 110;
			const dy = 300 + (i % 3) * 20;
			el.style.transition = `transform .7s cubic-bezier(.5,0,.75,.4), opacity .55s ${i * 12}ms`;
			el.style.transform = `translate(${dx}px,${dy}px)`;
			el.style.opacity = '0';
		});
	}

	function leave() {
		if (stopped) return;
		stopped = true;
		shown = false;
		setTimeout(() => {
			onfinished();
		}, 300);
	}

	function skip() {
		if (stopped) return;
		stopped = true;
		timers.forEach(clearTimeout);
		timers = [];
		shown = false;
		setTimeout(() => onfinished(), 50);
	}

	/* 首次手势：解锁音频并带声重播 */
	function unlockAndReplay() {
		const ok = initAudio();
		document.removeEventListener('pointerdown', unlockAndReplay);
		if (ok && stopped && !shown) {
			stopped = false;
			shown = true;
			playSequence();
		}
	}

	onMount(() => {
		/* 门控：设置关闭 / 自动化环境 / reduced-motion / 已看过 */
		let skipIntro = false;
		if (!$settings.openingAnimation) skipIntro = true;
		if (isAutomated) skipIntro = true;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) skipIntro = true;
		try {
			if (localStorage.getItem('structvis:intro-seen:v1') === '1') skipIntro = true;
		} catch {
			/* 隐私模式下忽略 */
		}
		if (skipIntro) {
			onfinished();
			return;
		}
		shown = true;
		playSequence();
		/* 跳过按钮 800ms 后出现；结束时标记已见 */
		setTimeout(() => (skipShown = true), 800);
		later(() => {
			try {
				localStorage.setItem('structvis:intro-seen:v1', '1');
			} catch {
				/* ignore */
			}
		}, 7400);
		document.addEventListener('pointerdown', unlockAndReplay);
	});

	onDestroy(() => {
		timers.forEach(clearTimeout);
		if (typeof document !== 'undefined')
			document.removeEventListener('pointerdown', unlockAndReplay);
		actx?.close().catch(() => {});
	});
</script>

{#if shown}
	<div class="sv-splash" id="sv-splash" bind:this={splashEl} use:portalToBody>
		<div class="sv-stage">
			<div class="sv-logo" bind:this={logoWrap}>
				<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
					<g class="sv-part sv-trunk" style="--fx:0px;--fy:-300px;--fx2:0px;--fy2:-15px;--d:150ms"
						><rect x="14" y="8" width="3" height="40" rx="1.5" fill="#1a1a1a" /></g
					>
					<g class="sv-part sv-branch" style="--fx:-380px;--fy:0px;--fx2:-19px;--fy2:0px;--d:320ms">
						<rect x="8" y="16" width="8" height="2.5" rx="1.25" fill="#1a1a1a" />
						<rect x="4" y="32" width="12" height="2.5" rx="1.25" fill="#1a1a1a" />
					</g>
					<g class="sv-part sv-rbranch" style="--fx:380px;--fy:0px;--fx2:19px;--fy2:0px;--d:490ms"
						><rect x="15" y="24" width="8" height="2.5" rx="1.25" fill="#1a1a1a" /></g
					>
					<circle
						class="sv-part sv-l-node"
						style="--fx:-300px;--fy:-280px;--fx2:-15px;--fy2:-14px;--d:660ms"
						cx="15.5"
						cy="6"
						r="3"
						fill="#d97706"
					/>
					<circle
						class="sv-part sv-l-node"
						style="--fx:300px;--fy:-220px;--fx2:15px;--fy2:-11px;--d:840ms"
						cx="6"
						cy="14"
						r="3"
						fill="#1b4965"
					/>
					<circle
						class="sv-part sv-l-node"
						style="--fx:-240px;--fy:300px;--fx2:-12px;--fy2:15px;--d:1020ms"
						cx="24"
						cy="22"
						r="3"
						fill="#1b4965"
					/>
					<circle
						class="sv-part sv-l-node"
						style="--fx:300px;--fy:300px;--fx2:15px;--fy2:15px;--d:1200ms"
						cx="2.5"
						cy="30"
						r="3"
						fill="#2d6a4f"
					/>
					{#each [420, 460, 500, 540] as fx, ri (fx)}
						<g
							class="sv-part sv-r-table"
							style="--fx:{fx}px;--fy:0px;--fx2:{Math.round(fx * 0.05)}px;--fy2:0px;--d:{1460 +
								ri * 180}ms"
						>
							<rect
								class="sv-fill"
								x="30"
								y={8 + ri * 12}
								width="22"
								height="8"
								rx="2"
								fill="#1a1a1a"
								opacity="0.15"
							/>
							<rect
								class="sv-frame"
								x="30"
								y={8 + ri * 12}
								width="22"
								height="8"
								rx="2"
								stroke="#1a1a1a"
								stroke-width="1.5"
								fill="none"
							/>
							<line
								class="sv-rowline"
								x1="34"
								y1={12 + ri * 12}
								x2="48"
								y2={12 + ri * 12}
								stroke="#1a1a1a"
								stroke-width="1.2"
								stroke-linecap="round"
							/>
						</g>
					{/each}
				</svg>
			</div>

			<div class="sv-brand">
				<span class="sv-brand-name">
					{#each letterMeta as l (l.ch + l.d)}
						<span
							class="sv-brand-letter"
							style="--dx:{l.dx}px;--dx2:{l.dx2}px;--dx3:{l.dx3}px;--dx4:{l.dx4}px;--d:{l.d}ms"
							>{l.ch}</span
						>
					{/each}
				</span>
				<span class="sv-brand-dot" bind:this={brandDot}></span>
			</div>

			<p class="sv-tagline">
				{#each taglineChars as c (c.ch + c.d)}
					<span class="sv-tword" style="--d:{c.d}ms">{c.ch}</span>
				{/each}
			</p>
		</div>
	</div>
	<button class="sv-skip" class:show={skipShown} use:portalToBody onclick={skip}>跳过 →</button>
{/if}

<style>
	.sv-splash {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: var(--color-paper);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 1;
	}
	.sv-splash::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(to right, var(--color-line-hair) 1px, transparent 1px),
			linear-gradient(to bottom, var(--color-line-hair) 1px, transparent 1px);
		background-size: 56px 56px;
		opacity: 0.28;
	}

	.sv-stage {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.sv-logo {
		width: 132px;
		height: 132px;
	}
	.sv-logo svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	/* 吸附 */
	.sv-part {
		opacity: 0;
		will-change: transform;
		animation: sv-snap-in 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-delay: var(--d, 0ms);
	}
	@keyframes sv-snap-in {
		0% {
			transform: translate(var(--fx, 0), var(--fy, 0)) scale(0.5);
			opacity: 0;
		}
		28% {
			opacity: 1;
		}
		72% {
			transform: translate(var(--fx2, 0), var(--fy2, 0)) scale(1.09);
			opacity: 1;
		}
		87% {
			transform: translate(0, 0) scale(0.95);
			opacity: 1;
		}
		100% {
			transform: translate(0, 0) scale(1);
			opacity: 1;
		}
	}

	.sv-rowline {
		transform: scaleX(0);
		transform-origin: left;
	}

	/* 字母拼装 */
	.sv-brand {
		display: flex;
		align-items: center;
		margin-top: 30px;
	}
	.sv-brand-name {
		display: flex;
		overflow: visible;
	}
	.sv-brand-letter {
		font-family: var(--font-display);
		font-size: clamp(38px, 5vw, 58px);
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-ink);
		display: inline-block;
		opacity: 0;
		animation: sv-assemble 0.72s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-delay: var(--d, 0ms);
	}
	@keyframes sv-assemble {
		0% {
			transform: translate(var(--dx, 0), 0) scale(0.55, 0.55);
			opacity: 0;
		}
		38% {
			transform: translate(var(--dx2), 0) scale(1.14, 0.82);
			opacity: 1;
		}
		62% {
			transform: translate(var(--dx3), 0) scale(0.94, 1.08);
			opacity: 1;
		}
		82% {
			transform: translate(var(--dx4), 0) scale(1.02, 0.97);
			opacity: 1;
		}
		100% {
			transform: translate(0, 0) scale(1, 1);
			opacity: 1;
		}
	}
	.sv-brand-dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: var(--color-accent);
		margin-left: 12px;
		opacity: 0;
		transform: translate(260px, 0) scale(0.6);
	}

	/* 标语 */
	.sv-tagline {
		margin-top: 16px;
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
		max-width: 640px;
		line-height: 2;
	}
	.sv-tword {
		display: inline-block;
		opacity: 0;
		animation: sv-word-bounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-delay: var(--d, 0ms);
	}
	@keyframes sv-word-bounce {
		0% {
			opacity: 0;
			transform: translateY(18px) scale(0.92);
		}
		55% {
			opacity: 1;
			transform: translateY(-5px) scale(1.04);
		}
		80% {
			transform: translateY(2px);
		}
		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* 跳过 */
	.sv-skip {
		position: fixed;
		bottom: 24px;
		right: 24px;
		z-index: 10000;
		padding: 6px 14px;
		border-radius: 999px;
		border: 1px solid var(--color-line-regular);
		background: #fff;
		color: var(--color-ink-3);
		font-size: 12px;
		font-family: var(--font-body);
		cursor: pointer;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.3s,
			color 0.2s,
			border-color 0.2s;
	}
	.sv-skip.show {
		opacity: 0.9;
		pointer-events: auto;
	}
	.sv-skip:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}
</style>

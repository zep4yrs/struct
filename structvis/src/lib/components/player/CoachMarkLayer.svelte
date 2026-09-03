<script lang="ts">
	import { tick } from 'svelte';

	/**
	 * 首访功能引导层（Story-1 / audit-12）：
	 * - 仅首次访问展示（localStorage 门控），逐个聚光播放器七个操作
	 * - tap 驱动（移动端可用），Esc / 点击遮罩推进，「跳过引导」随时退出
	 * - 测试环境自动跳过：navigator.webdriver 或 __DSH_NO_SCENE__ 标志
	 * - prefers-reduced-motion 下不播放脉冲动画
	 *
	 * 定位契约：本层必须挂在 document.body 下（portal action）——组件原挂载点
	 * .algo-player 带 backdrop-filter，会把 position:fixed 后代的包含块劫持为
	 * 播放器卡片自身，导致聚光环整体错位（偏移 = 卡片相对视口的偏移）。
	 * 锚点用视口坐标测量，滚动/布局变化时重测（scroll 捕获 + 字体就绪后重测）。
	 */
	const STORAGE_KEY = 'structvis:onboarded:v1';

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	const STEPS = [
		{ sel: 'preset', label: '演示数据', desc: '切换内置示例数据集，观察不同输入下的执行过程。' },
		{
			sel: 'custom',
			label: '自定义',
			desc: '输入你自己的数据（如 9,4,6,2），播放器会用它重建动画。'
		},
		{
			sel: 'share',
			label: '分享',
			desc: '复制一条链接，别人打开就恢复你当前的输入、步数与速度。'
		},
		{
			sel: 'hands-on',
			label: '动手',
			desc: '先预测再验证：点击画布上的两个元素，看你是否猜中下一步的交换。'
		},
		{
			sel: 'projector',
			label: '投影',
			desc: '进入全屏讲授模式，适合课堂大屏；←→ 翻页，空格播放。'
		},
		{ sel: 'script', label: '剧本', desc: '导入 / 导出每一步的讲解旁白，方便备课与复用。' },
		{
			sel: 'mode',
			label: '演示 / 练习',
			desc: '切到练习模式后，关键步骤会弹出题目，答对才算过关。'
		}
	];

	let active = $state(false);
	let step = $state(0);
	let box = $state<{ top: number; left: number; width: number; height: number } | null>(null);
	let cardEl: HTMLDivElement | undefined = $state();

	const reduced =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function shouldShow(): boolean {
		if (typeof window === 'undefined') return false;
		try {
			if (localStorage.getItem(STORAGE_KEY) === '1') return false;
		} catch {
			return false;
		}
		const w = window as unknown as Record<string, unknown>;
		if (w.__DSH_NO_SCENE__) return false; // e2e / 无头环境
		if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return false;
		return true;
	}

	function measure(): boolean {
		const el = document.querySelector<HTMLElement>(`[data-coach="${STEPS[step].sel}"]`);
		if (!el) return false;
		const r = el.getBoundingClientRect();
		if (r.width === 0 && r.height === 0) return false;
		box = {
			top: Math.max(8, r.top - 6),
			left: Math.max(8, r.left - 6),
			width: r.width + 12,
			height: r.height + 12
		};
		return true;
	}

	function placeCard(): void {
		tick().then(() => {
			if (!active || !box || !cardEl) return;
			const bw = cardEl.offsetWidth || 240;
			const bh = cardEl.offsetHeight || 140;
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			let top = box.top + box.height + 14;
			if (top + bh > vh - 12) top = Math.max(12, box.top - bh - 14);
			let left = box.left + box.width / 2 - bw / 2;
			left = Math.min(Math.max(12, left), vw - bw - 12);
			cardEl.style.top = `${top}px`;
			cardEl.style.left = `${left}px`;
			// preventScroll：聚焦引发的滚动会让视口坐标测量失效
			cardEl.querySelector<HTMLElement>('.coach-next')?.focus({ preventScroll: true });
		});
	}

	function showStep(i: number): void {
		step = i;
		if (!measure()) {
			// 锚点缺失（未来改版删钮）→ 静默结束，绝不阻塞学习
			finish();
			return;
		}
		placeCard();
	}

	function next(): void {
		if (step >= STEPS.length - 1) {
			finish();
			return;
		}
		showStep(step + 1);
	}

	function finish(): void {
		active = false;
		try {
			localStorage.setItem(STORAGE_KEY, '1');
		} catch {
			/* 忽略 */
		}
	}

	$effect(() => {
		if (!shouldShow()) return;
		// 等布局与 webfont 稳定后再定位首个锚点（字体换行会改变按钮几何）
		const onSettled = () => {
			if (!shouldShow()) return;
			if (!measure()) {
				finish();
				return;
			}
			active = true;
			placeCard();
		};
		tick().then(() => {
			const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
			const ready = fonts ? fonts.ready : Promise.resolve();
			ready.then(() => requestAnimationFrame(onSettled));
		});
	});
</script>

<svelte:window
	onresize={() => active && measure()}
	onscroll={() => active && measure()}
	onkeydown={(e) => {
		if (!active) return;
		if (e.key === 'Escape') finish();
		else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
	}}
/>

{#if active}
	<div class="coach-root" role="dialog" aria-label="新手功能引导" use:portal>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="coach-scrim" onclick={next}></div>
		{#if box}
			<div
				class="coach-ring"
				class:pulse={!reduced}
				style="top:{box.top}px;left:{box.left}px;width:{box.width}px;height:{box.height}px;"
			></div>
			<div class="coach-card" bind:this={cardEl}>
				<p class="coach-kicker">功能引导 · 第 {step + 1} / {STEPS.length} 步</p>
				<p class="coach-title">{STEPS[step].label}</p>
				<p class="coach-desc">{STEPS[step].desc}</p>
				<div class="coach-actions">
					<button class="coach-skip" onclick={finish}>跳过引导</button>
					<button class="btn btn-accent btn-sm coach-next" onclick={next}>
						{step === STEPS.length - 1 ? '开始学习' : '下一步'}
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.coach-root {
		position: fixed;
		inset: 0;
		z-index: 95;
	}

	.coach-scrim {
		position: absolute;
		inset: 0;
		background: transparent; /* 遮暗由 ring 的巨型阴影承担，保证高亮区透亮 */
		cursor: pointer;
	}

	.coach-ring {
		position: fixed;
		border-radius: 10px;
		box-shadow: 0 0 0 9999px rgba(15, 15, 15, 0.45);
		border: 2px solid var(--color-accent);
		pointer-events: none;
		transition:
			top 180ms var(--ease-out),
			left 180ms var(--ease-out),
			width 180ms var(--ease-out),
			height 180ms var(--ease-out);
	}

	.coach-ring.pulse {
		animation: coach-pulse 1.6s ease-in-out infinite;
	}

	@keyframes coach-pulse {
		0%,
		100% {
			outline-color: rgba(217, 119, 6, 0);
		}
		50% {
			outline: 3px solid rgba(217, 119, 6, 0.55);
			outline-offset: 3px;
		}
	}

	.coach-card {
		position: fixed;
		width: min(260px, calc(100vw - 32px));
		padding: 12px 14px;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-md);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.08),
			0 16px 48px rgba(0, 0, 0, 0.18);
		z-index: 96;
	}

	.coach-kicker {
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-2);
		margin-bottom: 6px;
	}

	.coach-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-ink);
		margin-bottom: 4px;
	}

	.coach-desc {
		font-size: 13px;
		line-height: 1.55;
		color: var(--color-ink-2);
		margin-bottom: 12px;
	}

	.coach-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.coach-skip {
		border: none;
		background: transparent;
		color: var(--color-ink-2);
		font-size: 12px;
		cursor: pointer;
		padding: 4px 2px;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.coach-skip:hover {
		color: var(--color-ink);
	}
</style>

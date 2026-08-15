<script lang="ts">
	import { tick, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, HighlightType } from '$lib/engines/algorithm/types';
	import { precomputeBarIdentities, easeOutCubic } from './array-render-utils';
	import { resolveCSSVar, hexToRgba } from '../visualization-utils';
	import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
		/** 手动模拟练习：点击柱子的回调（传入柱下标） */
		onBarClick?: (index: number) => void;
		/** 手动模拟练习：外部选中的柱子下标（高亮显示） */
		clickSelected?: number[];
	}

	let { steps, playbackPos, onBarClick, clickSelected = [] }: Props = $props();

	// 柱点击 → 下标换算（挂在 host.canvasEl 上，仅在有回调时激活）
	let clickCleanup: (() => void) | null = null;
	$effect(() => {
		clickCleanup?.();
		clickCleanup = null;
		if (!onBarClick || !host.canvasEl) return;
		const el = host.canvasEl;
		const handler = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
			if (!step) return;
			const n = step.data.length;
			const { barWidth, gap, startX } = getBarLayout(n);
			const maxValue = Math.max(1, ...step.data);
			const maxHeight = canvasHeight - PADDING_TOP - PADDING_BOTTOM;
			// 落在柱体矩形内？
			for (let i = 0; i < n; i++) {
				const bx = startX + i * (barWidth + gap) + gap / 2;
				const bh = getBarHeight(step.data[i] ?? 1, maxValue, maxHeight);
				const by = canvasHeight - PADDING_BOTTOM - bh;
				if (x >= bx && x <= bx + barWidth && y >= by && y <= by + bh) {
					onBarClick(i);
					return;
				}
			}
		};
		el.addEventListener('click', handler);
		clickCleanup = () => el.removeEventListener('click', handler);
	});
	onDestroy(() => clickCleanup?.());

	// 画布与尺寸由 CanvasHost 统一管理（resize/ResizeObserver/主题监听）；
	// CanvasHost 通过 onDraw 回调注入最新状态（$state 响应式）
	let host: CanvasHostState = $state({
		canvasEl: undefined,
		ctx: null,
		dpr: 1,
		width: 600,
		height: 280
	});
	let ctx = $derived(host.ctx);
	let canvasWidth = $derived(host.width);
	let canvasHeight = $derived(host.height);

	let barIdsAtStep = $derived(precomputeBarIdentities(steps));

	const PADDING_X = 40;
	const PADDING_TOP = 48;
	const PADDING_BOTTOM = 44;
	const BAR_GAP_RATIO = 0.35;

	// 颜色 — 编辑技术极简主义
	let colors = $state({
		bg: 'transparent',
		defaultBar: '#F3F1EC',
		defaultBorder: '#E5E2DB',
		pivot: '#9B2226',
		compare: '#1B4965',
		sorted: '#2D6A4F',
		current: '#D97706',
		ink: '#1A1A1A',
		ink2: '#5A5A5A',
		ink3: '#9A9A9A',
		baseline: '#E5E2DB',
		compareFill: 'rgba(27, 73, 101, 0.08)',
		partitionBg: 'rgba(27, 73, 101, 0.06)',
		partitionBorder: 'rgba(27, 73, 101, 0.18)'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		// 半透明色由主题 token 动态生成，暗色主题下保持对比度
		const academic = resolveCSSVar('--color-academic');
		colors = {
			bg: 'transparent',
			defaultBar: resolveCSSVar('--color-subtle'),
			defaultBorder: resolveCSSVar('--color-line-hair'),
			pivot: resolveCSSVar('--color-danger'),
			compare: academic,
			sorted: resolveCSSVar('--color-success'),
			current: resolveCSSVar('--color-accent'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			baseline: resolveCSSVar('--color-line-hair'),
			compareFill: hexToRgba(academic, 0.1),
			partitionBg: hexToRgba(academic, 0.08),
			partitionBorder: hexToRgba(academic, 0.22)
		};
	}

	function getBarLayout(n: number) {
		const availableWidth = canvasWidth - PADDING_X * 2;
		const totalBarWidth = availableWidth / n;
		const barWidth = Math.min(64, totalBarWidth * (1 - BAR_GAP_RATIO));
		const gap = totalBarWidth * BAR_GAP_RATIO;
		const totalW = n * (barWidth + gap);
		const startX = Math.max(PADDING_X, (canvasWidth - totalW) / 2);
		const maxHeight = canvasHeight - PADDING_TOP - PADDING_BOTTOM;
		return { barWidth, gap, maxHeight, startX };
	}

	function getBarX(position: number, n: number): number {
		const { barWidth, gap, startX } = getBarLayout(n);
		return startX + position * (barWidth + gap) + gap / 2;
	}

	function getBarHeight(value: number, maxValue: number, maxHeight: number): number {
		return Math.max(6, (value / maxValue) * maxHeight);
	}

	// === 颜色插值（高亮状态平滑过渡，不再瞬间跳变） ===
	function parseColorStr(c: string): { r: number; g: number; b: number; a: number } | null {
		const hex = c.match(/^#([0-9a-fA-F]{6})$/);
		if (hex) {
			const n = parseInt(hex[1], 16);
			return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
		}
		const rgb = c.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/);
		if (rgb) {
			return {
				r: Math.round(Number(rgb[1])),
				g: Math.round(Number(rgb[2])),
				b: Math.round(Number(rgb[3])),
				a: rgb[4] !== undefined ? Number(rgb[4]) : 1
			};
		}
		return null;
	}

	function lerpColorStr(a: string, b: string, t: number): string {
		// 端点保真：直接返回原色值（保持 hex 格式，测试与视觉一致）
		if (t <= 0) return a;
		if (t >= 1) return b;
		const pa = parseColorStr(a);
		const pb = parseColorStr(b);
		if (!pa || !pb) return t < 0.5 ? a : b;
		const r = Math.round(pa.r + (pb.r - pa.r) * t);
		const g = Math.round(pa.g + (pb.g - pa.g) * t);
		const bl = Math.round(pa.b + (pb.b - pa.b) * t);
		const al = pa.a + (pb.a - pa.a) * t;
		return al < 1 ? `rgba(${r}, ${g}, ${bl}, ${al.toFixed(3)})` : `rgb(${r}, ${g}, ${bl})`;
	}

	// 获取柱子颜色状态
	function getBarState(
		position: number,
		step: AlgorithmStep
	): {
		fill: string;
		border: string;
		compareRing: boolean;
		valueColor: string;
	} {
		const highlights = step.highlights;
		let fill = colors.defaultBar;
		let border = colors.defaultBorder;
		let compareRing = false;
		let valueColor = colors.ink3;

		// 优先级：pivot > sorted > current > compare > 默认
		// 状态可以叠加（比如 compare 是边框环 + 保持底色）

		const hasPivot = highlights.some((h) => h.type === 'pivot' && h.indices.includes(position));
		const hasSorted = highlights.some((h) => h.type === 'sorted' && h.indices.includes(position));
		const hasCompare = highlights.some((h) => h.type === 'compare' && h.indices.includes(position));
		const hasSwap = highlights.some((h) => h.type === 'swap' && h.indices.includes(position));
		const hasPointerI = highlights.some(
			(h) => h.type === 'pointer-i' && h.indices.includes(position)
		);
		const hasPointerJ = highlights.some(
			(h) => h.type === 'pointer-j' && h.indices.includes(position)
		);

		if (hasPivot) {
			fill = colors.pivot;
			border = colors.pivot;
			valueColor = colors.pivot;
		} else if (hasSorted) {
			fill = colors.sorted;
			border = colors.sorted;
			valueColor = colors.sorted;
		} else if (hasSwap) {
			fill = colors.pivot;
			border = colors.pivot;
			valueColor = colors.pivot;
		} else if (hasPointerI && !hasCompare) {
			fill = colors.current;
			border = colors.current;
			valueColor = colors.current;
		} else if (hasPointerJ && !hasCompare) {
			fill = colors.compare;
			border = colors.compare;
			valueColor = colors.compare;
		}

		if (hasCompare && !hasPivot && !hasSorted) {
			compareRing = true;
			fill = colors.compareFill;
			border = colors.compare;
			valueColor = colors.compare;
		}

		return { fill, border, compareRing, valueColor };
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const fromIdx = Math.floor(pos);
		const toIdx = Math.min(fromIdx + 1, steps.length - 1);
		const t = pos - fromIdx;
		const easedT = easeOutCubic(t);

		const fromStep = steps[fromIdx];
		const toStep = steps[toIdx];
		const n = fromStep.data.length;

		// 用循环求最大而非 Math.max(...spread)：空数组不产生 -Infinity，大数组无栈溢出风险
		let maxValue = 1;
		for (const v of fromStep.data) if (v > maxValue) maxValue = v;
		for (const v of toStep.data) if (v > maxValue) maxValue = v;
		const { barWidth, maxHeight } = getBarLayout(n);

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// 1. 分区背景
		drawPartitionBg(fromStep, toStep, easedT, n);

		// 2. 基线
		ctx.strokeStyle = colors.baseline;
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		const baselineY = canvasHeight - PADDING_BOTTOM;
		ctx.moveTo(PADDING_X, baselineY);
		ctx.lineTo(canvasWidth - PADDING_X, baselineY);
		ctx.stroke();

		// 3. 柱子
		const fromIds = barIdsAtStep[fromIdx] || [];
		const toIds = barIdsAtStep[toIdx] || [];
		const allIds = new Set([...fromIds, ...toIds]);

		for (const barId of allIds) {
			const fromPos = fromIds.indexOf(barId);
			const toPos = toIds.indexOf(barId);
			const actualFrom = fromPos >= 0 ? fromPos : toPos;
			const actualTo = toPos >= 0 ? toPos : fromPos;

			const currentPos = actualFrom + (actualTo - actualFrom) * easedT;
			const x = getBarX(currentPos, n);

			const value = fromStep.data[actualFrom] ?? toStep.data[actualTo];
			const height = getBarHeight(value, maxValue, maxHeight);
			const y = canvasHeight - PADDING_BOTTOM - height;

			// 颜色插值：从上一帧颜色平滑过渡到当前帧（不再瞬间跳变）
			const fromState = getBarState(actualFrom, fromStep);
			const toState = getBarState(actualTo, toStep);
			const fill = lerpColorStr(fromState.fill, toState.fill, easedT);
			const border = lerpColorStr(fromState.border, toState.border, easedT);
			const valueColor = lerpColorStr(fromState.valueColor, toState.valueColor, easedT);
			const ringT =
				(fromState.compareRing ? 1 : 0) +
				((toState.compareRing ? 1 : 0) - (fromState.compareRing ? 1 : 0)) * easedT;

			drawBar(x, y, barWidth, height, fill, border, ringT > 0.01, 0.15 * ringT);

			// 柱子底部数值
			drawBarValue(x, canvasHeight - PADDING_BOTTOM + 8, value, valueColor);

			// 索引（底部）
			drawBarIndex(x, canvasHeight - PADDING_BOTTOM + 24, Math.round(currentPos));
		}

		// 4. 指针标签（文字式，不是胶囊）
		drawPointerLabels(fromStep, toStep, easedT, n);

		// 5. 手动模拟练习：外部选中的柱子高亮（琥珀色描边 + 顶部三角）
		if (clickSelected.length > 0 && ctx) {
			const stepNow = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
			if (stepNow) {
				const maxV = Math.max(1, ...stepNow.data);
				for (const idx of clickSelected) {
					if (idx < 0 || idx >= n) continue;
					const x = getBarX(idx, n);
					const bh = getBarHeight(stepNow.data[idx] ?? 1, maxV, maxHeight);
					const by = canvasHeight - PADDING_BOTTOM - bh;
					ctx.strokeStyle = colors.current;
					ctx.lineWidth = 2.5;
					ctx.strokeRect(x - 1, by - 1, barWidth + 2, bh + 2);
					// 顶部标记
					ctx.fillStyle = colors.current;
					ctx.beginPath();
					ctx.moveTo(x + barWidth / 2, by - 10);
					ctx.lineTo(x + barWidth / 2 - 5, by - 2);
					ctx.lineTo(x + barWidth / 2 + 5, by - 2);
					ctx.closePath();
					ctx.fill();
				}
			}
		}
	}

	function drawBar(
		x: number,
		y: number,
		w: number,
		h: number,
		fill: string,
		border: string,
		compareRing: boolean,
		ringAlpha = 0.15
	) {
		if (!ctx) return;
		const radius = Math.min(3, w / 2);

		// 比较态的外发光环（透明度随过渡淡入淡出）
		if (compareRing) {
			ctx.save();
			ctx.shadowColor = colors.compare;
			ctx.shadowBlur = 0;
			ctx.strokeStyle = colors.compare;
			ctx.lineWidth = 2;
			ctx.beginPath();
			const rx = x - 2;
			const ry = y - 2;
			const rw = w + 4;
			const rh = h + 4;
			const rr = radius + 2;
			ctx.moveTo(rx + rr, ry);
			ctx.lineTo(rx + rw - rr, ry);
			ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
			ctx.lineTo(rx + rw, ry + rh);
			ctx.lineTo(rx, ry + rh);
			ctx.lineTo(rx, ry + rr);
			ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
			ctx.closePath();
			ctx.globalAlpha = ringAlpha;
			ctx.fillStyle = colors.compare;
			ctx.fill();
			ctx.globalAlpha = 1;
			ctx.restore();
		}

		ctx.fillStyle = fill;
		ctx.strokeStyle = border;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + w - radius, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
		ctx.lineTo(x + w, y + h);
		ctx.lineTo(x, y + h);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	function drawBarValue(x: number, y: number, value: number, color: string) {
		if (!ctx) return;
		ctx.fillStyle = color;
		ctx.font = "500 10px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(String(value), x + 0.5, y);
	}

	function drawBarIndex(x: number, y: number, index: number) {
		if (!ctx) return;
		ctx.fillStyle = colors.ink3;
		ctx.font = "9px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(`[${index}]`, x + 0.5, y);
	}

	function drawPartitionBg(fromStep: AlgorithmStep, toStep: AlgorithmStep, t: number, n: number) {
		if (!ctx) return;

		const fromHl = fromStep.highlights.find((h) => h.type === 'partition');
		const toHl = toStep.highlights.find((h) => h.type === 'partition');

		if (!fromHl && !toHl) return;

		const fromStart = fromHl?.indices[0] ?? 0;
		const fromEnd = fromHl?.indices[fromHl.indices.length - 1] ?? n - 1;
		const toStart = toHl?.indices[0] ?? 0;
		const toEnd = toHl?.indices[toHl.indices.length - 1] ?? n - 1;

		const start = fromStart + (toStart - fromStart) * t;
		const end = fromEnd + (toEnd - fromEnd) * t;

		const startX = getBarX(start, n) - 10;
		const endX = getBarX(end, n) + getBarLayout(n).barWidth + 10;

		const y = PADDING_TOP - 6;
		const height = canvasHeight - PADDING_TOP - PADDING_BOTTOM + 12;

		ctx.fillStyle = colors.partitionBg;
		ctx.fillRect(startX, y, endX - startX, height);

		ctx.strokeStyle = colors.partitionBorder;
		ctx.lineWidth = 1;
		ctx.setLineDash([3, 3]);
		ctx.beginPath();
		ctx.moveTo(startX, y);
		ctx.lineTo(startX, y + height);
		ctx.moveTo(endX, y);
		ctx.lineTo(endX, y + height);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	function drawPointerLabels(fromStep: AlgorithmStep, toStep: AlgorithmStep, t: number, n: number) {
		if (!ctx) return;

		const pointerDefs = [
			{ type: 'pivot' as HighlightType, label: '基准', dy: -18, color: colors.pivot },
			{ type: 'pointer-i' as HighlightType, label: 'i', dy: -6, color: colors.current },
			{ type: 'pointer-j' as HighlightType, label: 'j', dy: -6, color: colors.compare }
		];

		for (const { type, label, dy, color } of pointerDefs) {
			const fromHl = fromStep.highlights.find((h) => h.type === type);
			const toHl = toStep.highlights.find((h) => h.type === type);

			const fromAlpha = fromHl ? 1 : 0;
			const toAlpha = toHl ? 1 : 0;
			const alpha = fromAlpha + (toAlpha - fromAlpha) * t;

			if (alpha <= 0.01) continue;

			const fromPos = fromHl?.indices[0] ?? toHl?.indices[0] ?? 0;
			const toPos = toHl?.indices[0] ?? fromHl?.indices[0] ?? 0;
			const pos = fromPos + (toPos - fromPos) * t;

			const x = getBarX(pos, n) + getBarLayout(n).barWidth / 2;
			const y = PADDING_TOP + dy;

			ctx.globalAlpha = alpha;
			ctx.fillStyle = color;
			ctx.font = "600 10px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';

			ctx.fillText(label, x + 0.5, y);

			ctx.globalAlpha = 1;
		}
	}

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		tick().then(() => draw());
	});
</script>

<!-- 画布生命周期（resize/ResizeObserver/主题监听）由 CanvasHost 统一管理 -->
<CanvasHost
	minW={320}
	minH={220}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>

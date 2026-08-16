<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, DpCellHighlight } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, stepProgress } from '../visualization-utils';
	import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';
	import { easeOutCubic } from '../array/array-render-utils';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
	}

	let { steps, playbackPos }: Props = $props();

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

	const PAD = 14;
	const HEADER_H = 30;

	let colors = $state({
		bg: 'transparent',
		headerBg: '#F3F1EC',
		border: '#E5E2DB',
		ink: '#1A1A1A',
		ink2: '#5A5A5A',
		ink3: '#9A9A9A',
		current: '#D97706',
		depend: '#1B4965',
		keep: '#2d6a4f',
		take: '#6b21a8',
		cellBg: '#FFFFFF'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			bg: 'transparent',
			headerBg: resolveCSSVar('--color-subtle'),
			border: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			current: resolveCSSVar('--color-accent'),
			depend: resolveCSSVar('--color-academic'),
			keep: resolveCSSVar('--color-success'),
			take: resolveCSSVar('--color-accent'),
			cellBg: resolveCSSVar('--color-surface')
		};
	}

	function hlColor(t: DpCellHighlight['type']): string {
		switch (t) {
			case 'current':
				return colors.current;
			case 'depend':
				return colors.depend;
			case 'keep':
				return colors.keep;
			case 'take':
				return colors.take;
		}
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const { fromIdx, t } = stepProgress(playbackPos, steps.length);
		const easedT = easeOutCubic(t);
		// 内容跟随当前已完成步骤（与状态文本同步）；高亮按 from→to 插值，播放中渐变过渡
		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const dp = step.dp;
		if (!dp || dp.grid.length === 0) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const rows = dp.grid.length;
		const cols = dp.grid[0].length;
		const colW = Math.max(46, Math.floor((canvasWidth - PAD * 2) / cols));
		const rowH = Math.max(28, Math.floor((canvasHeight - HEADER_H - PAD * 2) / rows));
		const totalW = colW * cols;
		const totalH = HEADER_H + rowH * rows;
		const x0 = Math.max(PAD, (canvasWidth - totalW) / 2);
		const y0 = PAD;

		// 表格底色
		ctx.fillStyle = colors.cellBg;
		ctx.fillRect(x0, y0, totalW, totalH);

		// 表头行(列头)
		ctx.fillStyle = colors.headerBg;
		ctx.fillRect(x0, y0, totalW, HEADER_H);
		// 表头列(行头)
		ctx.fillRect(x0, y0 + HEADER_H, HEADER_H, rowH * rows);

		// 角标
		ctx.fillStyle = colors.ink3;
		ctx.font = "11px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(dp.cornerLabel ?? '', x0 + HEADER_H / 2, y0 + HEADER_H / 2 + 1);

		// 列头
		ctx.fillStyle = colors.ink2;
		for (let c = 1; c < cols; c++) {
			const cx = x0 + HEADER_H + (c - 1) * colW;
			ctx.fillText(String(dp.colHeaders[c - 1] ?? ''), cx + colW / 2, y0 + HEADER_H / 2 + 1);
		}

		// 行头
		for (let r = 1; r < rows; r++) {
			const cy = y0 + HEADER_H + (r - 1) * rowH;
			ctx.fillText(String(dp.rowHeaders[r - 1] ?? ''), x0 + HEADER_H / 2, cy + rowH / 2 + 1);
		}

		// 格子值 + 高亮
		const hlMap = new Map<string, DpCellHighlight>();
		for (const h of dp.highlights ?? []) hlMap.set(h.row + ',' + h.col, h);
		const fromDp = steps[fromIdx].dp;
		const fromHlMap = new Map<string, DpCellHighlight>();
		for (const h of fromDp?.highlights ?? []) fromHlMap.set(h.row + ',' + h.col, h);

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const gx = x0 + HEADER_H + c * colW;
				const gy = y0 + HEADER_H + r * rowH;
				const v = dp.grid[r][c];
				if (v === undefined || v === null) continue;

				const hl = hlMap.get(r + ',' + c);
				const fromHl = fromHlMap.get(r + ',' + c);
				if (hl || fromHl) {
					const a = (fromHl ? 1 : 0) + ((hl ? 1 : 0) - (fromHl ? 1 : 0)) * easedT;
					if (a > 0.02) {
						const col = hl ? hlColor(hl.type) : hlColor(fromHl!.type);
						ctx.globalAlpha = a;
						ctx.fillStyle = col + '22';
						ctx.fillRect(gx + 1, gy + 1, colW - 2, rowH - 2);
						ctx.strokeStyle = col;
						ctx.lineWidth = 1.6;
						ctx.strokeRect(gx + 1.5, gy + 1.5, colW - 3, rowH - 3);
						ctx.globalAlpha = 1;
					}
					ctx.fillStyle = hl
						? hl.type === 'depend'
							? colors.depend
							: hl.type === 'keep'
								? colors.keep
								: colors.ink
						: colors.ink;
				} else {
					ctx.fillStyle = colors.ink;
				}
				ctx.font = "600 12px 'JetBrains Mono', Consolas, monospace";
				ctx.fillText(String(v), gx + colW / 2, gy + rowH / 2 + 1);
			}
		}

		// 网格线
		ctx.strokeStyle = colors.border;
		ctx.lineWidth = 0.5;
		for (let r = 0; r <= rows; r++) {
			const y = y0 + HEADER_H + r * rowH;
			ctx.beginPath();
			ctx.moveTo(x0, y);
			ctx.lineTo(x0 + totalW, y);
			ctx.stroke();
		}
		for (let c = 0; c <= cols; c++) {
			const x = x0 + HEADER_H + c * colW;
			ctx.beginPath();
			ctx.moveTo(x, y0);
			ctx.lineTo(x, y0 + totalH);
			ctx.stroke();
		}

		// 回溯箭头(LCS)
		for (const a of dp.arrows ?? []) {
			const fx = x0 + HEADER_H + a.fromCol * colW + colW / 2;
			const fy = y0 + HEADER_H + a.fromRow * rowH + rowH / 2;
			const tx = x0 + HEADER_H + a.toCol * colW + colW / 2;
			const ty = y0 + HEADER_H + a.toRow * rowH + rowH / 2;
			ctx.strokeStyle = colors.take;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(fx, fy);
			ctx.lineTo(tx, ty);
			ctx.stroke();
			// 箭头
			const ang = Math.atan2(ty - fy, tx - fx);
			const sz = 7;
			ctx.beginPath();
			ctx.moveTo(tx, ty);
			ctx.lineTo(tx - sz * Math.cos(ang - 0.45), ty - sz * Math.sin(ang - 0.45));
			ctx.lineTo(tx - sz * Math.cos(ang + 0.45), ty - sz * Math.sin(ang + 0.45));
			ctx.closePath();
			ctx.fill();
		}

		// 轴标签
		ctx.fillStyle = colors.ink3;
		ctx.font = "11px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		if (dp.colLabel) ctx.fillText(dp.colLabel, x0 + totalW / 2, y0 + totalH + 6);
		if (dp.rowLabel) {
			ctx.save();
			ctx.translate(x0 - 8, y0 + HEADER_H + (rowH * rows) / 2);
			ctx.rotate(-Math.PI / 2);
			ctx.fillText(dp.rowLabel, 0, 0);
			ctx.restore();
		}
	}

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		tick().then(() => draw());
	});
</script>

<CanvasHost
	minW={420}
	minH={240}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>

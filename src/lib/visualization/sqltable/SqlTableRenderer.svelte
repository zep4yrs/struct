<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, watchThemeChange } from '../visualization-utils';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
	}

	let { steps, playbackPos }: Props = $props();

	let canvasEl: HTMLCanvasElement | undefined;
	let ctx: CanvasRenderingContext2D | null = null;
	let dpr = 1;
	let unwatchTheme: (() => void) | undefined;

	let canvasWidth = 600;
	let canvasHeight = 360;

	const ROW_H = 34;
	const HEADER_H = 40;
	const PAD = 16;

	let colors = $state({
		bg: 'transparent',
		headerBg: '#F3F1EC',
		border: '#E5E2DB',
		ink: '#1A1A1A',
		ink2: '#5A5A5A',
		ink3: '#9A9A9A',
		current: '#D97706',
		compare: '#1B4965',
		rowBg: '#FFFFFF'
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
			compare: resolveCSSVar('--color-academic'),
			rowBg: resolveCSSVar('--color-surface')
		};
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const step = steps[Math.floor(pos)];
		const table = step.table;
		if (!table || table.rows.length === 0) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			ctx.fillStyle = colors.ink3;
			ctx.font = '13px var(--font-mono)';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('(空结果集)', canvasWidth / 2, canvasHeight / 2);
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const currentSet = new Set(step.highlights.find((h) => h.type === 'current')?.indices ?? []);

		const colW = Math.max(64, Math.floor((canvasWidth - PAD * 2) / table.columns.length));
		const totalW = colW * table.columns.length;
		const x0 = Math.max(PAD, (canvasWidth - totalW) / 2);
		const visibleRows = Math.min(
			table.rows.length,
			Math.floor((canvasHeight - HEADER_H) / ROW_H) - 1
		);
		const tableH = HEADER_H + visibleRows * ROW_H;

		// 表格底色
		ctx.fillStyle = colors.rowBg;
		ctx.fillRect(x0, 0, totalW, tableH);

		// 表头
		ctx.fillStyle = colors.headerBg;
		ctx.fillRect(x0, 0, totalW, HEADER_H);
		ctx.fillStyle = colors.ink;
		ctx.font = '600 11px var(--font-mono)';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		table.columns.forEach((c, ci) => {
			ctx?.fillText(c, x0 + ci * colW + 12, HEADER_H / 2 + 1);
		});

		// 行
		for (let ri = 0; ri < visibleRows; ri++) {
			const y = HEADER_H + ri * ROW_H;
			const row = table.rows[ri];

			if (ri > 0) {
				ctx.strokeStyle = colors.border;
				ctx.lineWidth = 0.5;
				ctx.beginPath();
				ctx.moveTo(x0, y);
				ctx.lineTo(x0 + totalW, y);
				ctx.stroke();
			}

			ctx.fillStyle = colors.ink2;
			ctx.font = '12px var(--font-mono)';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			row.forEach((cell, ci) => {
				ctx?.fillText(String(cell), x0 + ci * colW + 12, y + ROW_H / 2 + 1);
			});
		}

		// 边框
		ctx.strokeStyle = colors.border;
		ctx.lineWidth = 1;
		ctx.strokeRect(x0, 0, totalW, tableH);

		// 列分隔线
		ctx.strokeStyle = colors.border;
		ctx.lineWidth = 0.5;
		for (let ci = 1; ci < table.columns.length; ci++) {
			ctx.beginPath();
			ctx.moveTo(x0 + ci * colW, 0);
			ctx.lineTo(x0 + ci * colW, tableH);
			ctx.stroke();
		}

		// 当前检查行高亮（WHERE 逐行判定）
		for (const idx of currentSet) {
			if (idx >= visibleRows) continue;
			const y = HEADER_H + idx * ROW_H;
			ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
			ctx.fillRect(x0 + 1, y + 1, totalW - 2, ROW_H - 1);
		}

		// 行号标注
		if (visibleRows < table.rows.length) {
			ctx.fillStyle = colors.ink3;
			ctx.font = '600 10px var(--font-mono)';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText(
				`… 共 ${table.rows.length} 行（显示前 ${visibleRows} 行）`,
				canvasWidth / 2,
				tableH + 10
			);
		}
	}

	function resizeCanvas() {
		if (!browser || !canvasEl) return;
		const container = canvasEl.parentElement;
		if (!container) return;

		dpr = window.devicePixelRatio || 1;
		const rect = container.getBoundingClientRect();
		canvasWidth = Math.max(420, rect.width - 24);
		canvasHeight = Math.max(240, rect.height - 24);

		canvasEl.width = canvasWidth * dpr;
		canvasEl.height = canvasHeight * dpr;
		canvasEl.style.width = `${canvasWidth}px`;
		canvasEl.style.height = `${canvasHeight}px`;

		ctx = canvasEl.getContext('2d');
		if (ctx) ctx.scale(dpr, dpr);

		updateColorsFromCSS();
		draw();
	}

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		tick().then(() => draw());
	});

	onMount(() => {
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		draw();
		unwatchTheme = watchThemeChange(() => {
			updateColorsFromCSS();
			draw();
		});
	});

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener('resize', resizeCanvas);
		unwatchTheme?.();
	});
</script>

<div class="sql-canvas-wrap">
	<canvas bind:this={canvasEl}></canvas>
</div>

<style>
	.sql-canvas-wrap {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>

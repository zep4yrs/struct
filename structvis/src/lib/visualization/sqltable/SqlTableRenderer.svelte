<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, hexToRgba } from '../visualization-utils';
	import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
	}

	let { steps, playbackPos }: Props = $props();

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
		rowBg: '#FFFFFF',
		rowHighlight: 'rgba(217, 119, 6, 0.12)'
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
			rowBg: resolveCSSVar('--color-surface'),
			rowHighlight: hexToRgba(resolveCSSVar('--color-accent'), 0.14)
		};
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const step = steps[Math.floor(pos)];
		const table = step.table;
		if (!table || table.rows.length === 0 || table.columns.length === 0) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			ctx.fillStyle = colors.ink3;
			ctx.font = "13px 'JetBrains Mono', Consolas, monospace";
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
		ctx.font = "600 11px 'JetBrains Mono', Consolas, monospace";
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
			ctx.font = "12px 'JetBrains Mono', Consolas, monospace";
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
			ctx.fillStyle = colors.rowHighlight;
			ctx.fillRect(x0 + 1, y + 1, totalW - 2, ROW_H - 1);
		}

		// 行号标注
		if (visibleRows < table.rows.length) {
			ctx.fillStyle = colors.ink3;
			ctx.font = "600 10px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText(
				`… 共 ${table.rows.length} 行（显示前 ${visibleRows} 行）`,
				canvasWidth / 2,
				tableH + 10
			);
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
	minW={420}
	minH={240}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>

<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar } from '../visualization-utils';
	import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';

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

	const PAD = 18;
	const ROW_H = 44;
	const NODE_W = 52;
	const NODE_H = 30;

	let colors = $state({
		bg: 'transparent',
		nodeBg: '#FFFFFF',
		border: '#E5E2DB',
		line: '#C9C6BF',
		ink: '#1A1A1A',
		ink3: '#9A9A9A',
		current: '#1B4965',
		inserted: '#D97706',
		sentinel: '#F3F1EC'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			bg: 'transparent',
			nodeBg: resolveCSSVar('--color-surface'),
			border: resolveCSSVar('--color-line-regular'),
			line: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink3: resolveCSSVar('--color-ink-3'),
			current: resolveCSSVar('--color-academic'),
			inserted: resolveCSSVar('--color-accent'),
			sentinel: resolveCSSVar('--color-subtle')
		};
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const sk = step.skipList;
		if (!sk || sk.levels.length === 0) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const lvCount = sk.levels.length;
		const rowH = Math.min(ROW_H, (canvasHeight - PAD * 2) / Math.max(1, lvCount));
		const drawableW = canvasWidth - PAD * 2 - NODE_W * 2;

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		for (let li = 0; li < lvCount; li++) {
			const levelData = sk.levels[li];
			const y = PAD + li * rowH + rowH / 2;
			const isCur = li === sk.curLevel;

			// 层标签
			ctx.fillStyle = isCur ? colors.current : colors.ink3;
			ctx.font = "600 11px 'JetBrains Mono', Consolas, monospace";
			ctx.fillText('L' + levelData.level, PAD + 10, y);

			// 节点
			const nodes = levelData.nodes;
			const gap = drawableW / (nodes.length + 1);
			// 链接线
			ctx.strokeStyle = colors.line;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(PAD + NODE_W, y);
			ctx.lineTo(PAD + NODE_W + NODE_W + gap * nodes.length, y);
			ctx.stroke();

			nodes.forEach((key, i) => {
				const x = PAD + NODE_W + gap * (i + 1);
				const isInserted = sk.insertedKey === key;
				const isCurrent = sk.curKey === key && isCur;

				ctx.fillStyle = isInserted
					? colors.inserted + '33'
					: isCurrent
						? colors.current
						: colors.nodeBg;
				ctx.strokeStyle = isInserted ? colors.inserted : isCurrent ? colors.current : colors.border;
				ctx.lineWidth = isInserted || isCurrent ? 2 : 1.2;
				ctx.beginPath();
				ctx.roundRect(x - NODE_W / 2, y - NODE_H / 2, NODE_W, NODE_H, 6);
				ctx.fill();
				ctx.stroke();

				ctx.fillStyle = isInserted ? colors.inserted : isCurrent ? '#FFFFFF' : colors.ink;
				ctx.font = "600 13px 'JetBrains Mono', Consolas, monospace";
				ctx.fillText(String(key), x, y + 1);
			});
		}

		// 说明文字
		if (sk.note) {
			ctx.fillStyle = colors.ink3;
			ctx.font = "11px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'left';
			ctx.fillText(sk.note, PAD, canvasHeight - 8);
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
	minW={480}
	minH={240}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>

<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, HashData } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, lerpColorStr, stepProgress } from '../visualization-utils';
	import { easeOutCubic } from '../array/array-render-utils';
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

	const LOGICAL_W = 1000;
	const LOGICAL_H = 560;
	const SLOT_W = 76;
	const SLOT_H = 76;
	const SLOT_GAP = 10;
	const CHAIN_SLOT_W = 56;
	const CHAIN_SLOT_H = 32;
	const CHAIN_NODE_W = 58;
	const CHAIN_NODE_H = 32;
	const CHAIN_ROW_H = 38;
	const CHAIN_TOP = 64;
	const CHAIN_X = 110;

	let colors = $state({
		inkInverse: '#FAF9F6',
		node: '#FFFFFF',
		border: '#D4D0C8',
		edge: '#D4D0C8',
		ink: '#1A1A1A',
		ink2: '#6B6B6B',
		ink3: '#9A9A9A',
		current: '#D97706',
		sorted: '#2D6A4F',
		compare: '#1B4965'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			inkInverse: resolveCSSVar('--color-ink-inverse'),
			node: resolveCSSVar('--color-surface'),
			border: resolveCSSVar('--color-line-regular'),
			edge: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			current: resolveCSSVar('--color-accent'),
			sorted: resolveCSSVar('--color-success'),
			compare: resolveCSSVar('--color-academic')
		};
	}

	function frame(): HashData | undefined {
		const step = steps[Math.min(Math.floor(playbackPos), steps.length - 1)];
		return step?.hash;
	}

	function draw() {
		if (!ctx) return;
		const f = frame();
		ctx.save();
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		const scale = Math.min(canvasWidth / LOGICAL_W, canvasHeight / LOGICAL_H, 1.35);
		ctx.scale(scale, scale);
		if (!f) {
			ctx.restore();
			return;
		}
		drawHeader(f);
		if (f.mode === 'chain') drawChain(f, fromFrame());
		else drawLinear(f, fromFrame());
		if (f.summary && isComplete()) drawSummary(f);
		ctx.restore();
	}

	/** 上一帧的 hash 数据（颜色过渡用；无上一帧时回退当前帧） */
	function fromFrame(): HashData | undefined {
		const { fromIdx } = stepProgress(playbackPos, steps.length);
		return steps[Math.min(fromIdx, steps.length - 1)]?.hash;
	}

	function isComplete(): boolean {
		const step = steps[Math.min(Math.floor(playbackPos), steps.length - 1)];
		return step?.type === 'complete';
	}

	// ---------- 头部：散列公式 + 当前关键字 ----------

	function drawHeader(f: HashData) {
		if (!ctx) return;
		ctx.font = '600 16px ui-monospace, SFMono-Regular, Menlo, monospace';
		ctx.fillStyle = colors.ink;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(`除留余数法：H(x) = x mod ${f.size}`, 36, 30);

		if (f.key !== undefined) {
			const tag = `正在${f.found === undefined && f.key !== undefined ? '处理' : '查找'}关键字 ${f.keyLabel ?? f.key}`;
			ctx.textAlign = 'right';
			ctx.fillStyle = colors.ink2;
			ctx.fillText(tag, LOGICAL_W - 36, 30);
			if (f.hashValue !== undefined) {
				ctx.textAlign = 'center';
				ctx.fillStyle = colors.compare;
				ctx.fillText(
					`H(${f.keyLabel ?? f.key}) = ${f.key} mod ${f.size} = ${f.hashValue}`,
					LOGICAL_W / 2,
					30
				);
			}
		}

		// 探测序列
		if (f.probe && f.probe.length > 0) {
			ctx.font = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';
			ctx.fillStyle = colors.ink2;
			ctx.textAlign = 'center';
			ctx.fillText(`探测序列：${f.probe.join(' → ')}`, LOGICAL_W / 2, 58);
		}
	}

	// ---------- 线性探测：单行槽位 ----------

	function drawLinear(f: HashData, fromF: HashData | undefined) {
		if (!ctx) return;
		const totalW = f.size * SLOT_W + (f.size - 1) * SLOT_GAP;
		const xStart = (LOGICAL_W - totalW) / 2;
		const y = LOGICAL_H / 2 - SLOT_H / 2 + 20;
		const easedT = easeOutCubic(stepProgress(playbackPos, steps.length).t);
		const probed = new Set(f.probe ?? []);
		const cur = f.current;
		const placed = f.placed;
		const fromProbed = new Set(fromF?.probe ?? []);
		const fromCur = fromF?.current;
		const fromPlaced = fromF?.placed;

		const slotState = (
			pr: Set<number>,
			c: number | undefined,
			pl: number | undefined,
			i: number
		) => {
			if (pl === i) {
				return { fill: colors.sorted, border: colors.sorted, text: colors.inkInverse, lw: 2 };
			}
			if (c === i) {
				return { fill: colors.current, border: colors.current, text: colors.inkInverse, lw: 2 };
			}
			if (pr.has(i)) {
				return { fill: colors.node, border: colors.compare, text: colors.ink, lw: 2 };
			}
			return { fill: colors.node, border: colors.border, text: colors.ink, lw: 1.2 };
		};

		for (let i = 0; i < f.size; i++) {
			const x = xStart + i * (SLOT_W + SLOT_GAP);
			// 防御：slots 短于 size 时按空槽处理（不画出 "undefined"）
			const v = f.slots[i] === undefined ? null : f.slots[i];
			const fromState = slotState(fromProbed, fromCur, fromPlaced, i);
			const toState = slotState(probed, cur, placed, i);
			const fill = lerpColorStr(fromState.fill, toState.fill, easedT);
			const border = lerpColorStr(fromState.border, toState.border, easedT);
			const textColor = lerpColorStr(fromState.text, toState.text, easedT);
			const lw = toState.lw;

			ctx.beginPath();
			ctx.roundRect(x, y, SLOT_W, SLOT_H, 8);
			ctx.fillStyle = fill;
			ctx.fill();
			ctx.strokeStyle = border;
			ctx.lineWidth = lw;
			if (v === null && cur !== i && placed !== i) ctx.setLineDash([4, 4]);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.font = '600 18px ui-monospace, SFMono-Regular, Menlo, monospace';
			ctx.fillStyle = v === null && cur !== i && placed !== i ? colors.ink3 : textColor;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(v === null ? '空' : String(v), x + SLOT_W / 2, y + SLOT_H / 2 + 1);

			// 槽位下标
			ctx.font = '500 12px ui-monospace, SFMono-Regular, Menlo, monospace';
			ctx.fillStyle = colors.ink3;
			ctx.fillText(String(i), x + SLOT_W / 2, y + SLOT_H + 20);
		}
	}

	// ---------- 链地址法：槽位 + 链表 ----------

	function drawChain(f: HashData, fromF: HashData | undefined) {
		if (!ctx) return;
		const easedT = easeOutCubic(stepProgress(playbackPos, steps.length).t);
		const curRow = f.current;
		let highlightNode: { row: number; pos: number } | undefined;
		if (f.key !== undefined && curRow !== undefined && f.chains?.[curRow]) {
			const pos = f.chains[curRow].findIndex((k) => k === f.key);
			if (pos !== -1) highlightNode = { row: curRow, pos };
		}
		const fromCurRow = fromF?.current;

		for (let row = 0; row < f.size; row++) {
			const y = CHAIN_TOP + row * CHAIN_ROW_H;
			const chain = f.chains?.[row] ?? [];

			// 槽位（颜色插值）
			const fromIsCur = fromCurRow === row;
			const isCur = curRow === row;
			const slotFill = lerpColorStr(
				fromIsCur ? colors.current : colors.node,
				isCur ? colors.current : colors.node,
				easedT
			);
			const slotBorder = lerpColorStr(
				fromIsCur ? colors.current : colors.border,
				isCur ? colors.current : colors.border,
				easedT
			);
			ctx.beginPath();
			ctx.roundRect(CHAIN_X, y, CHAIN_SLOT_W, CHAIN_SLOT_H, 6);
			ctx.fillStyle = slotFill;
			ctx.fill();
			ctx.strokeStyle = slotBorder;
			ctx.lineWidth = isCur ? 2 : 1.2;
			ctx.stroke();
			ctx.font = '600 14px ui-monospace, SFMono-Regular, Menlo, monospace';
			ctx.fillStyle = lerpColorStr(
				fromIsCur ? colors.inkInverse : colors.ink,
				isCur ? colors.inkInverse : colors.ink,
				easedT
			);
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(row), CHAIN_X + CHAIN_SLOT_W / 2, y + CHAIN_SLOT_H / 2 + 1);

			if (chain.length === 0) continue;

			// 链上结点（颜色插值）
			let x = CHAIN_X + CHAIN_SLOT_W + 12;
			for (let p = 0; p < chain.length; p++) {
				const k = chain[p];
				const isHL =
					highlightNode !== undefined && highlightNode.row === row && highlightNode.pos === p;
				const nodeFill = lerpColorStr(
					isHL ? colors.sorted : colors.node,
					isHL ? colors.sorted : colors.node,
					easedT
				);
				const nodeBorder = lerpColorStr(
					isHL ? colors.sorted : colors.border,
					isHL ? colors.sorted : colors.border,
					easedT
				);
				const nodeText = lerpColorStr(
					isHL ? colors.inkInverse : colors.ink,
					isHL ? colors.inkInverse : colors.ink,
					easedT
				);
				ctx.beginPath();
				ctx.roundRect(x, y, CHAIN_NODE_W, CHAIN_NODE_H, 6);
				ctx.fillStyle = nodeFill;
				ctx.fill();
				ctx.strokeStyle = nodeBorder;
				ctx.lineWidth = isHL ? 2 : 1.2;
				ctx.stroke();
				ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, monospace';
				ctx.fillStyle = nodeText;
				ctx.fillText(String(k), x + CHAIN_NODE_W / 2, y + CHAIN_SLOT_H / 2 + 1);

				// 链指针（结点间连接线 + 尾指针）
				const fromX = x + CHAIN_NODE_W;
				const toX = p < chain.length - 1 ? fromX + 12 : fromX + 22;
				const midY = y + CHAIN_SLOT_H / 2;
				ctx.strokeStyle = colors.edge;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(fromX, midY);
				ctx.lineTo(toX - 6, midY);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(toX - 6, midY - 4);
				ctx.lineTo(toX, midY);
				ctx.lineTo(toX - 6, midY + 4);
				ctx.closePath();
				ctx.fillStyle = colors.edge;
				ctx.fill();

				x = toX;
				if (x > LOGICAL_W - 24) break;
			}
		}

		if (f.key !== undefined && curRow !== undefined) {
			ctx.font = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';
			ctx.textAlign = 'left';
			ctx.fillStyle = colors.ink3;
			ctx.fillText('链头', CHAIN_X + CHAIN_SLOT_W + 12, CHAIN_TOP - 12);
			ctx.textAlign = 'right';
			ctx.fillStyle = colors.compare;
			ctx.fillText(
				`H(${f.keyLabel ?? f.key}) = ${f.hashValue} → 槽 ${curRow}`,
				LOGICAL_W - 36,
				CHAIN_TOP - 12
			);
		}
	}

	function drawSummary(f: HashData) {
		if (!ctx) return;
		ctx.font = '600 17px ui-monospace, SFMono-Regular, Menlo, monospace';
		ctx.fillStyle = colors.sorted;
		ctx.textAlign = 'center';
		ctx.fillText(f.summary ?? '', LOGICAL_W / 2, LOGICAL_H - 24);
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
	minW={680}
	minH={442}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>

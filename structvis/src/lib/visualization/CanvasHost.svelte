<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { watchCanvasSize, watchThemeChange } from './visualization-utils';

	/** 渲染器可用的画布状态（$state 响应式，经 onDraw 回调注入） */
	export interface CanvasHostState {
		canvasEl: HTMLCanvasElement | undefined;
		ctx: CanvasRenderingContext2D | null;
		dpr: number;
		width: number;
		height: number;
	}

	interface Props {
		/** 画布最小宽（默认 320） */
		minW?: number;
		/** 画布最小高（默认 220） */
		minH?: number;
		/** 尺寸变化 / 主题变化 / 挂载后调用：参数为最新画布状态 */
		onDraw: (host: CanvasHostState) => void;
		/** 主题变化回调（渲染器重取 token 颜色）；挂载时也会调用一次 */
		onThemeChange?: () => void;
	}

	let { minW = 320, minH = 220, onDraw, onThemeChange }: Props = $props();

	const state: CanvasHostState = $state({
		canvasEl: undefined,
		ctx: null,
		dpr: 1,
		width: 600,
		height: 280
	});
	let cleanupResize: (() => void) | undefined;
	let unwatchTheme: (() => void) | undefined;

	function resize() {
		if (!browser || !state.canvasEl) return;
		const container = state.canvasEl.parentElement;
		if (!container) return;
		state.dpr = window.devicePixelRatio || 1;
		const rect = container.getBoundingClientRect();
		state.width = Math.max(minW, rect.width - 24);
		state.height = Math.max(minH, rect.height - 24);
		state.canvasEl.width = state.width * state.dpr;
		state.canvasEl.height = state.height * state.dpr;
		state.canvasEl.style.width = `${state.width}px`;
		state.canvasEl.style.height = `${state.height}px`;
		state.ctx = state.canvasEl.getContext('2d');
		if (state.ctx) state.ctx.scale(state.dpr, state.dpr);
		onDraw(state);
	}

	onMount(() => {
		onThemeChange?.(); // 挂载即同步主题色，避免暗色主题下使用亮色初始值
		resize();
		cleanupResize = watchCanvasSize(() => state.canvasEl, resize);
		unwatchTheme = watchThemeChange(() => {
			onThemeChange?.();
			onDraw(state);
		});
	});

	onDestroy(() => {
		cleanupResize?.();
		unwatchTheme?.();
	});
</script>

<div class="canvas-host">
	<canvas bind:this={state.canvasEl}></canvas>
</div>

<style>
	.canvas-host {
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

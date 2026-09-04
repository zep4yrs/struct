<script lang="ts">
	import { onMount } from 'svelte';
	import AlgoPlayer from './AlgoPlayer.svelte';
	import { ScriptedResultEngine } from '$lib/engines/sql/ScriptEngine';

	/**
	 * SQL 剧本页通用包装：异步装载剧本引擎（sql.js 可用时逐帧真实执行），
	 * 统一「装载中 / 失败 / 就绪挂播放器」三态。
	 */
	interface Props {
		load: () => Promise<ScriptedResultEngine>;
		topicId: string;
		topicName: string;
	}

	let { load, topicId, topicName }: Props = $props();

	let engine = $state<ScriptedResultEngine | null>(null);
	let loadError = $state('');

	onMount(async () => {
		try {
			engine = await load();
		} catch (e) {
			loadError = (e as Error).message;
		}
	});
</script>

{#if engine}
	<AlgoPlayer {engine} {topicId} {topicName} />
{:else if loadError}
	<div class="script-state script-error" role="alert">剧本装载失败：{loadError}</div>
{:else}
	<!-- 骨架屏：与播放器布局同构，sql.js 冷加载（本地缺失→CDN）1-3s 内不再是白等 -->
	<div class="skeleton" aria-hidden="true">
		<div class="sk-row">
			<div class="sk-chip w110"></div>
			<div class="sk-chip w70"></div>
			<div class="sk-chip w70"></div>
			<div class="sk-spacer"></div>
			<div class="sk-chip w46"></div>
			<div class="sk-chip w46"></div>
		</div>
		<div class="sk-main">
			<div class="sk-canvas sk-anim"></div>
			<div class="sk-side">
				<div class="sk-line w80 sk-anim"></div>
				<div class="sk-line w95 sk-anim"></div>
				<div class="sk-line w70 sk-anim"></div>
				<div class="sk-line w88 sk-anim"></div>
				<div class="sk-line w60 sk-anim"></div>
			</div>
		</div>
		<div class="sk-row">
			<div class="sk-chip w46"></div>
			<div class="sk-bar sk-anim"></div>
			<div class="sk-chip w90"></div>
		</div>
		<p class="sk-hint" aria-live="polite">正在装载剧本与 SQLite 执行器……</p>
	</div>
{/if}

<style>
	.script-state {
		padding: 48px 24px;
		text-align: center;
		color: var(--color-ink-2);
		font-size: 14px;
	}

	.script-error {
		color: var(--color-danger, #9b2226);
	}

	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.sk-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.sk-spacer {
		flex: 1;
	}

	.sk-chip,
	.sk-line,
	.sk-canvas,
	.sk-bar {
		border-radius: 8px;
		background: color-mix(in srgb, var(--color-ink) 8%, transparent);
	}

	.sk-chip {
		height: 30px;
	}

	.w110 {
		width: 110px;
	}
	.w70 {
		width: 70px;
	}
	.w46 {
		width: 46px;
	}
	.w90 {
		width: 90px;
	}
	.w80 {
		width: 80%;
	}
	.w95 {
		width: 95%;
	}
	.w70 {
		width: 70%;
	}
	.w88 {
		width: 88%;
	}
	.w60 {
		width: 60%;
	}

	.sk-main {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(220px, 30%);
		gap: 12px;
	}

	@media (max-width: 900px) {
		.sk-main {
			grid-template-columns: 1fr;
		}
	}

	.sk-canvas {
		height: 380px;
	}

	.sk-side {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 16px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
	}

	.sk-line {
		height: 14px;
	}

	.sk-bar {
		flex: 1;
		height: 30px;
	}

	.sk-anim {
		position: relative;
		overflow: hidden;
	}

	.sk-anim::after {
		content: '';
		position: absolute;
		inset: 0;
		transform: translateX(-100%);
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, var(--color-ink) 7%, transparent),
			transparent
		);
		animation: sk-shimmer 1.3s infinite;
	}

	@keyframes sk-shimmer {
		to {
			transform: translateX(100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sk-anim::after {
			animation: none;
		}
	}

	.sk-hint {
		margin: 4px 0 0;
		text-align: center;
		color: var(--color-ink-3);
		font-size: 13px;
	}
</style>

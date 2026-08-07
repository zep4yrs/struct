<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		GraphStorageEngine,
		type StorageMode
	} from '$lib/engines/algorithm/graph/GraphStorageEngine';

	const PRESETS = [
		{ name: '无向图 5 顶点（邻接矩阵）', mode: 'adjacency-matrix' as StorageMode },
		{ name: '无向图 5 顶点（邻接表）', mode: 'adjacency-list' as StorageMode },
		{ name: '带权有向图（邻接矩阵）', mode: 'adjacency-matrix' as StorageMode }
	];

	function createEngine(preset: string): GraphStorageEngine {
		const e = new GraphStorageEngine();
		e.applyPreset(preset);
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].name));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§06</span>
			<span class="section-name">图状结构</span>
		</div>
		<h1 class="page-title">图的存储</h1>
		<p class="page-desc">
			同一张图可以用两种经典结构存储：<b>邻接矩阵</b>（二维数组，O(1) 查边，空间 O(V²)）和
			<b>邻接表</b>（数组+链表，空间 O(V+E)）。切换预设，观察矩阵逐格填充与链表逐头插入的过程。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="graph-storage" topicName="图的存储" />
	</div>
</div>

<style>
	.page {
		max-width: min(1440px, 100%);
		margin: 0 auto;
		padding: 48px 32px 64px;
		min-height: calc(100vh - 48px);
		display: flex;
		flex-direction: column;
	}

	.player-wrap {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 32px;
		margin-bottom: 32px;
	}

	.section-header {
		margin-bottom: 32px;
	}

	.section-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.section-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-sm);
		background: var(--color-academic);
		color: #fff;
		font-size: 11px;
		font-weight: 600;
	}

	.section-name {
		font-weight: 500;
	}

	.page-title {
		font-size: 32px;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0 0 12px;
	}

	.page-desc {
		font-size: 15px;
		line-height: 1.7;
		color: var(--color-ink-2);
		max-width: 760px;
		margin: 0;
	}
</style>

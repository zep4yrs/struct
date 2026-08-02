<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { IndexEngine, getIndexPresets } from '$lib/engines/db/IndexEngine';

	const PRESETS = getIndexPresets();

	function createEngine(preset: string): IndexEngine {
		const e = new IndexEngine();
		e.init({ preset });
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].name));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§06</span>
			<span class="section-name">索引与视图</span>
		</div>
		<h1 class="page-title">索引原理</h1>
		<p class="page-desc">
			索引的底层结构是 <b>B+ 树</b>：内部节点只存放分隔键，所有数据键在叶子节点，叶子间用指针连成链表。
			查找只需从根下钻一层比较 <b>O(log m n)</b> 次；范围查询定位下界后沿叶子链表顺序扫描。
			逐步播放，看等值查找、范围查找与插入分裂的完整过程。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="index" topicName="索引原理" />
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
		gap: 12px;
	}

	.section-label::before {
		content: '';
		width: 24px;
		height: 1px;
		background: var(--color-line-regular);
	}

	.section-num {
		color: var(--color-accent);
		font-weight: 500;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 500;
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin: 0 0 8px 0;
		color: var(--color-ink);
	}

	.page-desc {
		font-size: 14px;
		line-height: 1.7;
		color: var(--color-ink-2);
		max-width: 720px;
		margin: 0;
	}
</style>

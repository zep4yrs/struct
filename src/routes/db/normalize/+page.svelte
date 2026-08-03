<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { NormalizeEngine, getNormalizePresets } from '$lib/engines/db/NormalizeEngine';

	const PRESETS = getNormalizePresets();

	function createEngine(preset: string): NormalizeEngine {
		const e = new NormalizeEngine();
		e.init({ preset });
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].name));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§07</span>
			<span class="section-name">数据库设计</span>
		</div>
		<h1 class="page-title">关系规范化</h1>
		<p class="page-desc">
			范式判定按固定流程进行：<b>1NF</b>（属性原子性）→ <b>2NF</b>（消除非主属性对候选键的<b>部分依赖</b>）→
			<b>3NF</b>（消除<b>传递依赖</b>）→ <b>BCNF</b>（决定因素均为候选键）。违规的函数依赖标红，分解后标绿消除。
			逐步播放，看每个范式的判定依据与分解方法。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="normalize" topicName="关系规范化" />
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

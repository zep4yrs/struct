<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ErEngine, getErPresets } from '$lib/engines/db/ErEngine';

	const PRESETS = getErPresets();

	function createEngine(preset: string): ErEngine {
		const e = new ErEngine();
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
		<h1 class="page-title">E-R 模型</h1>
		<p class="page-desc">
			E-R 图是概念结构设计的核心工具：<b>矩形</b>表示实体、<b>椭圆</b>表示属性、<b>菱形</b
			>表示联系， 连线旁标注基数（1:1 / 1:n / m:n）。最后按转换规则把 E-R
			图映射为关系模式。逐步播放，看每个设计决策如何影响最终表结构。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="er" topicName="E-R 模型" />
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

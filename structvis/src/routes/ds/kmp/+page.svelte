<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { KMPEngine } from '$lib/engines/algorithm/search/KMPEngine';

	const DEFAULT_TEXT = 'acabaabaabcacaabc';
	const DEFAULT_PATTERN = 'abaabcac';

	function createEngine(): KMPEngine {
		const e = new KMPEngine();
		e.init({ text: DEFAULT_TEXT, pattern: DEFAULT_PATTERN });
		return e;
	}

	let engine = $state(createEngine());
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§04</span>
			<span class="section-name">串与数组</span>
		</div>
		<h1 class="page-title">串的模式匹配（KMP）</h1>
		<p class="page-desc">
			在长文本中查找模式串，KMP 比暴力匹配高明在：先求出模式串的 next 数组，
			匹配失配时让模式整体右滑、文本指针 i 从不回退。整体复杂度 O(n + m)， next
			数组记录的正是模式串自身的前后缀结构。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="kmp" topicName="串的模式匹配" />
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
		max-width: 620px;
		margin: 0;
	}
</style>

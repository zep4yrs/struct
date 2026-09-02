<script lang="ts">
	import { onMount } from 'svelte';
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { createHavingDeepEngine } from '$lib/engines/sql/scripts/having-deep';
	import { ScriptedResultEngine } from '$lib/engines/sql/ScriptEngine';

	// 剧本引擎需异步装载 sql.js（可用时逐帧真实执行），就绪后再挂播放器
	let engine = $state<ScriptedResultEngine | null>(null);
	let loadError = $state('');

	onMount(async () => {
		try {
			engine = await createHavingDeepEngine();
		} catch (e) {
			loadError = (e as Error).message;
		}
	});
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="WHERE 与 HAVING">
	{#snippet desc()}
		<b>WHERE 筛行、HAVING 筛组</b>——一条查询的执行顺序是 FROM → WHERE → GROUP BY → HAVING → SELECT →
		ORDER BY。逐帧观察分组前后的两次过滤各自丢掉了什么。
		<span class="mono">SQLite 方言演示</span>。
	{/snippet}
	{#if engine}
		<AlgoPlayer {engine} topicId="having-deep" topicName="WHERE 与 HAVING" />
	{:else if loadError}
		<div class="script-error" role="alert">剧本装载失败：{loadError}</div>
	{:else}
		<div class="script-loading" aria-live="polite">正在装载剧本与 SQLite 执行器……</div>
	{/if}
</AlgoPage>

<style>
	.script-loading,
	.script-error {
		padding: 48px 24px;
		text-align: center;
		color: var(--color-ink-2);
		font-size: 14px;
	}

	.script-error {
		color: var(--color-danger, #9b2226);
	}
</style>

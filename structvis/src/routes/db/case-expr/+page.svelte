<script lang="ts">
	import { onMount } from 'svelte';
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { createCaseExprEngine } from '$lib/engines/sql/scripts/case-expr';
	import { ScriptedResultEngine } from '$lib/engines/sql/ScriptEngine';

	// 剧本引擎需异步装载 sql.js（可用时逐帧真实执行），就绪后再挂播放器
	let engine = $state<ScriptedResultEngine | null>(null);
	let loadError = $state('');

	onMount(async () => {
		try {
			engine = await createCaseExprEngine();
		} catch (e) {
			loadError = (e as Error).message;
		}
	});
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="CASE 表达式">
	{#snippet desc()}
		行内 <b>if-else</b>：搜索 CASE 按区间归类、简单 CASE 按值映射，配合 GROUP BY
		一步完成分类统计。每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span>）。
	{/snippet}
	{#if engine}
		<AlgoPlayer {engine} topicId="case-expr" topicName="CASE 表达式" />
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

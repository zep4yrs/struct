<script lang="ts">
	import { onMount } from 'svelte';
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { createSqlFunctionsEngine } from '$lib/engines/sql/scripts/sql-functions';
	import { ScriptedResultEngine } from '$lib/engines/sql/ScriptEngine';

	// 剧本引擎需异步装载 sql.js（可用时逐帧真实执行），就绪后再挂播放器
	let engine = $state<ScriptedResultEngine | null>(null);
	let loadError = $state('');

	onMount(async () => {
		try {
			engine = await createSqlFunctionsEngine();
		} catch (e) {
			loadError = (e as Error).message;
		}
	});
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="SQL 函数演练">
	{#snippet desc()}
		字符串 / 数值 / 日期 / NULL 四组常用函数，在真实数据上逐帧演练：
		<span class="mono">UPPER · SUBSTR · INSTR · ROUND · strftime · COALESCE</span>。
		<span class="mono">SQLite 方言演示</span>，MySQL 差异见各帧说明。
	{/snippet}
	{#if engine}
		<AlgoPlayer {engine} topicId="sql-functions" topicName="SQL 函数演练" />
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

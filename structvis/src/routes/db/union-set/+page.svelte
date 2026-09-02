<script lang="ts">
	import { onMount } from 'svelte';
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { createUnionSetEngine } from '$lib/engines/sql/scripts/union-set';
	import { ScriptedResultEngine } from '$lib/engines/sql/ScriptEngine';

	// 剧本引擎需异步装载 sql.js（可用时逐帧真实执行），就绪后再挂播放器
	let engine = $state<ScriptedResultEngine | null>(null);
	let loadError = $state('');

	onMount(async () => {
		try {
			engine = await createUnionSetEngine();
		} catch (e) {
			loadError = (e as Error).message;
		}
	});
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="SQL 集合运算">
	{#snippet desc()}
		UNION 并 · INTERSECT 交 · EXCEPT 差——三个对<b>行集合</b>的直接运算。每帧都是一条真实执行的 SQL（<span
			class="mono">SQLite 方言演示</span
		>），观察两张报名表如何合并、求交、做差。
	{/snippet}
	{#if engine}
		<AlgoPlayer {engine} topicId="union-set" topicName="SQL 集合运算" />
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

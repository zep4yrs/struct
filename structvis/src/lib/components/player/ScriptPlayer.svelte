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
	<div class="script-state" aria-live="polite">正在装载剧本与 SQLite 执行器……</div>
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
</style>

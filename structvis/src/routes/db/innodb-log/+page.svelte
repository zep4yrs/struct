<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { InnoDbLogEngine } from '$lib/engines/db/InnoDbLogEngine';

	function createEngine(): InnoDbLogEngine {
		const e = new InnoDbLogEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§09" sectionName="存储进阶" title="InnoDB 日志体系">
	{#snippet desc()}
		一条 UPDATE 的日志旅程：<span class="mono">undo 回滚 / redo 恢复 / binlog 复制</span
		>，两阶段提交是纽带。
	{/snippet}
	<AlgoPlayer {engine} topicId="innodb-log" topicName="InnoDB 日志体系" />
</AlgoPage>

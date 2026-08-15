<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { JoinEngine } from '$lib/engines/sql/JoinEngine';

	function createEngine(): JoinEngine {
		const e = new JoinEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§02" sectionName="数据库查询" title="SQL 内连接 JOIN">
	{#snippet desc()}
		拿左表每一行去右表匹配连接条件，匹配成功的行对合并进结果表——这就是嵌套循环连接。 观察 <span
			class="mono">结果表</span
		> 如何逐行生长，不匹配的行如何被丢弃。
	{/snippet}
	<AlgoPlayer {engine} topicId="join" topicName="SQL 内连接 JOIN" />
</AlgoPage>

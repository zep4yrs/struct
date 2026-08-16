<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { MySqlArchEngine } from '$lib/engines/db/MySqlArchEngine';

	function createEngine(): MySqlArchEngine {
		const e = new MySqlArchEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§00" sectionName="数据库基础" title="MySQL 架构总览">
	{#snippet desc()}
		一条 SQL 的旅程：<span class="mono">连接器 → 解析器 → 优化器 → 执行器 → 存储引擎</span
		>。逐步高亮每个阶段的职责与产物。
	{/snippet}
	<AlgoPlayer {engine} topicId="mysql-arch" topicName="MySQL 架构总览" />
</AlgoPage>

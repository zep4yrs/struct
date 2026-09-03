<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { TransactionEngine, TX_PRESETS } from '$lib/engines/db/TransactionEngine';

	// 账户余额表（事务演示数据）
	const ACCOUNT_TABLE: SqlTableData = {
		columns: ['账户', '余额'],
		rows: [
			['A', 1000],
			['B', 1000]
		]
	};

	const TABLES: Record<string, SqlTableData> = { 账户: ACCOUNT_TABLE };

	function createEngine(mode: string): TransactionEngine {
		const e = new TransactionEngine();
		e.init({ mode, tables: TABLES });
		return e;
	}

	let engine = $state(createEngine(TX_PRESETS[0].mode));
</script>

<AlgoPage sectionNum="§08" sectionName="事务与并发" title="事务与并发控制">
	{#snippet desc()}
		事务是把一组数据库操作打包的<b>原子工作单元</b>，具有四种特性——<span class="mono">ACID</span
		>：<span class="mono">原子性</span>（要么全做，要么全不做）、<span class="mono">一致性</span
		>（事务前后完整性约束不变）、<span class="mono">隔离性</span>（并发互不干扰）、<span
			class="mono">持久性</span
		>（提交即永存）。逐步播放三种场景：转账提交、失败回滚、并发丢失更新。
	{/snippet}
	<AlgoPlayer {engine} topicId="transaction" topicName="事务与并发控制" />
</AlgoPage>

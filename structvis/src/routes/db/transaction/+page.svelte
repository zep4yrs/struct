<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { TransactionEngine, TX_PRESETS } from '$lib/engines/db/TransactionEngine';
	import type { SqlTable } from '$lib/engines/sql/SelectEngine';

	// 账户余额表（事务演示数据）
	const ACCOUNT_TABLE: SqlTable = {
		columns: ['账户', '余额'],
		rows: [
			['A', 1000],
			['B', 1000]
		]
	};

	const TABLES: Record<string, SqlTable> = { 账户: ACCOUNT_TABLE };

	function createEngine(mode: string): TransactionEngine {
		const e = new TransactionEngine();
		e.init({ mode, tables: TABLES });
		return e;
	}

	let engine = $state(createEngine(TX_PRESETS[0].mode));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§08</span>
			<span class="section-name">事务与并发</span>
		</div>
		<h1 class="page-title">事务与并发控制</h1>
		<p class="page-desc">
			事务是把一组数据库操作打包的<b>原子工作单元</b>，具有四种特性——<span class="mono">ACID</span
			>：<span class="mono">原子性</span>（要么全做，要么全不做）、<span class="mono">一致性</span
			>（事务前后完整性约束不变）、<span class="mono">隔离性</span>（并发互不干扰）、<span
				class="mono">持久性</span
			>（提交即永存）。逐步播放三种场景：转账提交、失败回滚、并发丢失更新。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="transaction" topicName="事务与并发控制" />
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
		max-width: 640px;
		margin: 0;
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-academic);
	}
</style>

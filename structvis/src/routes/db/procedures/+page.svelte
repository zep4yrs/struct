<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ProcedureEngine } from '$lib/engines/sql/ProcedureEngine';
	import type { ProcedureInput } from '$lib/engines/sql/ProcedureEngine';

	const FIRST_PRESET = {
		name: '计算员工平均工资',
		body: `DECLARE 总工资 INT DEFAULT 0;
DECLARE 平均工资 DECIMAL(10,2) DEFAULT 0;
DECLARE 人数 INT DEFAULT 0;

SELECT SUM(工资) INTO 总工资 FROM 员工;
SELECT COUNT(*) INTO 人数 FROM 员工;
SET 平均工资 = 总工资 / 人数;
SELECT 平均工资 AS 结果;`,
		callArgs: [] as (string | number)[]
	};

	function createEngine(preset: { name: string; body: string; callArgs: (string | number)[] }): ProcedureEngine {
		const e = new ProcedureEngine();
		const input: ProcedureInput = {
			name: preset.name,
			params: [],
			body: preset.body,
			callArgs: preset.callArgs
		};
		e.init(input);
		return e;
	}

	let engine = $state(createEngine(FIRST_PRESET));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§11</span>
			<span class="section-name">数据库对象</span>
		</div>
		<h1 class="page-title">存储过程</h1>
		<p class="page-desc">
			存储过程（Stored Procedure）是预编译在数据库端的<b>SQL 语句集</b>，支持参数、局部变量、条件分支与循环。调用时减少网络往返，适合封装高频业务逻辑。逐步播放，观察
			<span class="mono">DECLARE / SET / IF / WHILE / CALL</span> 的执行顺序与变量状态变化。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="procedures" topicName="存储过程" />
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
		max-width: 720px;
		margin: 0;
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-academic);
	}
</style>

<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { AdvancedQueryEngine, ADVANCED_PRESETS } from '$lib/engines/sql/AdvancedQueryEngine';
	import type { SqlTable } from '$lib/engines/sql/SelectEngine';

	// 学生表（教材风格示例数据，与 SQL 页一致）
	const STUDENT_TABLE: SqlTable = {
		columns: ['学号', '姓名', '专业', '成绩'],
		rows: [
			[20101, '张三', '计算机', 88],
			[20102, '李四', '软件工程', 92],
			[20103, '王五', '计算机', 76],
			[20104, '赵六', '网络工程', 85],
			[20105, '孙七', '软件工程', 63],
			[20106, '周八', '计算机', 95]
		]
	};

	// 选课表
	const SCORE_TABLE: SqlTable = {
		columns: ['学号', '课程号', '成绩'],
		rows: [
			[20101, 'C001', 90],
			[20101, 'C002', 85],
			[20102, 'C001', 95],
			[20103, 'C002', 78],
			[20105, 'C001', 60]
		]
	};

	const TABLES: Record<string, SqlTable> = { 学生: STUDENT_TABLE, 选课: SCORE_TABLE };

	function createEngine(sql: string): AdvancedQueryEngine {
		const e = new AdvancedQueryEngine();
		e.init({ sql, tables: TABLES });
		return e;
	}

	let engine = $state(createEngine(ADVANCED_PRESETS[0].sql));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§05</span>
			<span class="section-name">高级查询</span>
		</div>
		<h1 class="page-title">高级查询</h1>
		<p class="page-desc">
			在基础 SELECT 之上，四个重要子句扩展了查询能力：<span class="mono">HAVING</span>
			在分组后按聚合值筛选分组（WHERE 筛行、HAVING 筛组）；<span class="mono">LEFT JOIN</span>
			外连接保留左表全部行、右表无匹配补
			<span class="mono">NULL</span>；<span class="mono">UNION</span> 合并两个查询结果并去重；<span
				class="mono">EXISTS</span
			> 相关子查询对外层每一行执行一次子查询。逐步播放，观察每个子句的执行时机。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="sql-advanced" topicName="高级查询" />
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

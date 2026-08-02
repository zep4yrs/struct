<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { DmlEngine, DML_PRESETS } from '$lib/engines/sql/DmlEngine';
	import type { SqlTableData } from '$lib/engines/algorithm/types';

	// 学生成绩表（与 SQL 查询页同源，方便对照）
	const STUDENT_TABLE: SqlTableData = {
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

	function createEngine(sql: string): DmlEngine {
		const e = new DmlEngine();
		e.init({ sql, table: STUDENT_TABLE });
		return e;
	}

	let engine = $state(createEngine(DML_PRESETS[0].sql));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§04</span>
			<span class="section-name">数据查询</span>
		</div>
		<h1 class="page-title">数据更新</h1>
		<p class="page-desc">
			<b>INSERT / UPDATE / DELETE</b> 三类数据更新语句会<b>改变表中的数据</b>。与 SELECT 一样，WHERE
			子句限定受影响的行集；<span class="mono">UPDATE 与 DELETE 省略 WHERE 将作用于全部行</span>。
			逐步播放，观察每次更新对表的改变。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="dml" topicName="数据更新" />
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

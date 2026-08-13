<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
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

<AlgoPage sectionNum="§05" sectionName="高级查询" title="高级查询">
	{#snippet desc()}
		在基础 SELECT 之上，四个重要子句扩展了查询能力：<span class="mono">HAVING</span>
			在分组后按聚合值筛选分组（WHERE 筛行、HAVING 筛组）；<span class="mono">LEFT JOIN</span>
			外连接保留左表全部行、右表无匹配补
			<span class="mono">NULL</span>；<span class="mono">UNION</span> 合并两个查询结果并去重；<span
				class="mono">EXISTS</span
			> 相关子查询对外层每一行执行一次子查询。逐步播放，观察每个子句的执行时机。
	{/snippet}
	<AlgoPlayer {engine} topicId="sql-advanced" topicName="高级查询" />
</AlgoPage>
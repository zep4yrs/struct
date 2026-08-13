<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { SelectEngine, SELECT_PRESETS, type SqlTable } from '$lib/engines/sql/SelectEngine';

	// 学生表（教材风格示例数据）
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

	// 选课表（用于连接查询）
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

	function createEngine(sql: string): SelectEngine {
		const e = new SelectEngine();
		e.init({ sql, tables: TABLES });
		return e;
	}

	let engine = $state(createEngine(SELECT_PRESETS[0].sql));
</script>

<AlgoPage sectionNum="§04" sectionName="数据查询" title="MySQL 数据查询">
	{#snippet desc()}
		SELECT 语句按固定的<b>逻辑执行顺序</b>处理：<span class="mono"
			>FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY → LIMIT</span
		>。 先选表、连接、再筛行、再分组、再投影列、最后排序与截断。多表查询用
		<span class="mono">表名.列名</span> 限定列。逐步播放，观察每一子句对结果集的影响。
	{/snippet}
	<AlgoPlayer {engine} topicId="sql" topicName="MySQL 数据查询" />
</AlgoPage>

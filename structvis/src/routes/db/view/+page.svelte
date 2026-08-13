<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ViewEngine, VIEW_PRESETS } from '$lib/engines/sql/ViewEngine';
	import type { SqlTable } from '$lib/engines/sql/SelectEngine';

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

	// 选课表（用于连接视图）
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

	function createEngine(sql: string): ViewEngine {
		const e = new ViewEngine();
		e.init({ sql, tables: TABLES });
		return e;
	}

	let engine = $state(createEngine(VIEW_PRESETS[0].sql));
</script>

<AlgoPage sectionNum="§06" sectionName="索引与视图" title="视图创建与使用">
	{#snippet desc()}
		<b>CREATE VIEW</b> 把一条 SELECT 查询保存为<b>虚拟表</b
			>（视图）：视图本身不存数据，只存查询定义。 查询视图时数据库现场执行保存的 SELECT，因此<b
				>基表数据变化会立即反映到视图结果</b
			>。 逐步播放，看视图从定义、底层查询执行、到基表更新后自动刷新的完整过程。
	{/snippet}
	<AlgoPlayer {engine} topicId="view" topicName="视图创建与使用" />
</AlgoPage>
<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
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

<AlgoPage sectionNum="§04" sectionName="数据查询" title="数据更新">
	{#snippet desc()}
		<b>INSERT / UPDATE / DELETE</b> 三类数据更新语句会<b>改变表中的数据</b>。与 SELECT 一样，WHERE
			子句限定受影响的行集；<span class="mono">UPDATE 与 DELETE 省略 WHERE 将作用于全部行</span>。
			逐步播放，观察每次更新对表的改变。
	{/snippet}
	<AlgoPlayer {engine} topicId="dml" topicName="数据更新" />
</AlgoPage>
<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ExplainEngine } from '$lib/engines/sql/ExplainEngine';
	import type { SqlTableData } from '$lib/engines/algorithm/types';

	const STUDENT: SqlTableData = {
		columns: ['学号', '姓名', '专业', '成绩'],
		rows: [
			[20101, '张三', '计算机', 88],
			[20102, '李四', '软件工程', 92],
			[20103, '王五', '计算机', 76],
			[20104, '赵六', '网络工程', 85],
			[20105, '孙七', '软件工程', 63]
		]
	};

	const PRESETS = [
		'SELECT * FROM 学生 WHERE 学号 = 20103',
		'SELECT * FROM 学生 WHERE 成绩 >= 85',
		"SELECT * FROM 学生 WHERE 专业 = '计算机'"
	];

	function createEngine(): ExplainEngine {
		const e = new ExplainEngine();
		e.init({ sql: PRESETS[0], table: STUDENT, indexedCols: ['学号', '成绩'] });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§13" sectionName="优化原理" title="执行计划与索引选择">
	{#snippet desc()}
		<span>
			优化器为查询生成<b>候选执行计划</b>并估算代价：<span class="mono">全表扫描</span>按行读取，
			<span class="mono">索引查找</span>沿 B+ 树定位。等值/范围查询命中行少时索引胜出，
			选择性差的列则全表扫描更优。
		</span>
	{/snippet}
	<AlgoPlayer {engine} topicId="explain-plan" topicName="执行计划与索引选择" />
</AlgoPage>

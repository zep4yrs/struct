<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { WindowFunctionEngine } from '$lib/engines/sql/WindowFunctionEngine';
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
		'SELECT 学号, 姓名, 专业, 成绩, ROW_NUMBER() OVER (PARTITION BY 专业 ORDER BY 成绩 DESC) AS 排名 FROM 学生',
		'SELECT 学号, 姓名, 专业, 成绩, RANK() OVER (PARTITION BY 专业 ORDER BY 成绩 DESC) AS 名次 FROM 学生',
		'SELECT 学号, 成绩, SUM(成绩) OVER (ORDER BY 学号) AS 累计成绩 FROM 学生'
	];

	function createEngine(): WindowFunctionEngine {
		const e = new WindowFunctionEngine();
		e.init({ sql: PRESETS[0], table: STUDENT });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§12" sectionName="高级查询" title="窗口函数">
	{#snippet desc()}
		<span>
			窗口函数（<span class="mono">ROW_NUMBER / RANK / SUM ... OVER</span>）在<b>不折叠行数</b
			>的前提下， 按分区逐行计算：<span class="mono">PARTITION BY</span> 分组、<span class="mono"
				>ORDER BY</span
			> 组内排序。 它是排名、累计、移动平均等"每行带上下文"查询的核心工具。
		</span>
	{/snippet}
	<AlgoPlayer {engine} topicId="window-function" topicName="窗口函数" />
</AlgoPage>

<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { TriggerEngine } from '$lib/engines/sql/TriggerEngine';
	import type { TriggerEngineInput } from '$lib/engines/sql/TriggerEngine';

	const STUDENT_TABLE = {
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

	const FIRST_PRESET = {
		name: 'AFTER INSERT 自动记录选课',
		triggerSql: `CREATE TRIGGER 记录选课日志
AFTER INSERT ON 选课
FOR EACH ROW
BEGIN
  INSERT INTO 选课日志 VALUES (NEW.学号, NEW.课程号, '已选课');
END`,
		dmlSql: "INSERT INTO 选课 VALUES (20101, 'CS101', 95)"
	};

	function createEngine(preset: {
		name: string;
		triggerSql: string;
		dmlSql: string;
	}): TriggerEngine {
		const e = new TriggerEngine();
		const input: TriggerEngineInput = {
			triggerSql: preset.triggerSql,
			dmlSql: preset.dmlSql,
			table: STUDENT_TABLE
		};
		e.init(input);
		return e;
	}

	let engine = $state(createEngine(FIRST_PRESET));
</script>

<AlgoPage sectionNum="§10" sectionName="数据库对象" title="触发器">
	{#snippet desc()}
		触发器（Trigger）是绑定在表上的<b>自动执行程序</b>，当 DML 事件（<span class="mono"
				>INSERT / UPDATE / DELETE</span
			>）发生时自动调用。<b>BEFORE</b> 在语句执行前触发（可修改 NEW 值），<b>AFTER</b> 在语句执行后触发（常用于日志）。逐步播放，观察触发器如何响应数据变更。
	{/snippet}
	<AlgoPlayer {engine} topicId="triggers" topicName="触发器" />
</AlgoPage>
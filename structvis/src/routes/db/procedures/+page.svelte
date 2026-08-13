<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
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

	function createEngine(preset: {
		name: string;
		body: string;
		callArgs: (string | number)[];
	}): ProcedureEngine {
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

<AlgoPage sectionNum="§11" sectionName="数据库对象" title="存储过程">
	{#snippet desc()}
		存储过程（Stored Procedure）是预编译在数据库端的<b>SQL 语句集</b
			>，支持参数、局部变量、条件分支与循环。调用时减少网络往返，适合封装高频业务逻辑。逐步播放，观察
			<span class="mono">DECLARE / SET / IF / WHILE / CALL</span> 的执行顺序与变量状态变化。
	{/snippet}
	<AlgoPlayer {engine} topicId="procedures" topicName="存储过程" />
</AlgoPage>
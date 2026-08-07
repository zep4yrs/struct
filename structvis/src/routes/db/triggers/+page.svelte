<script lang="ts">
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

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§10</span>
			<span class="section-name">数据库对象</span>
		</div>
		<h1 class="page-title">触发器</h1>
		<p class="page-desc">
			触发器（Trigger）是绑定在表上的<b>自动执行程序</b>，当 DML 事件（<span class="mono"
				>INSERT / UPDATE / DELETE</span
			>）发生时自动调用。<b>BEFORE</b> 在语句执行前触发（可修改 NEW 值），<b>AFTER</b> 在语句执行后触发（常用于日志）。逐步播放，观察触发器如何响应数据变更。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="triggers" topicName="触发器" />
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
		max-width: 720px;
		margin: 0;
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-academic);
	}
</style>

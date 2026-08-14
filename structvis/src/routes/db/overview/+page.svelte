<script lang="ts">
	import ConceptQuiz, { type QuizItem } from '$lib/components/ui/ConceptQuiz.svelte';

	const QUIZ: QuizItem[] = [
		{
			prompt: '关系模型中，二维表的「行」和「列」分别称为？',
			options: ['元组 / 属性', '记录 / 字段', '实体 / 联系', '节点 / 边'],
			correct: 0,
			explanation: '关系模型把数据组织成二维表：行（记录）称元组，列（字段）称属性，表名即关系名。'
		},
		{
			prompt: '三级模式结构中，最接近用户、描述用户视图的是？',
			options: ['外模式（子模式）', '模式（逻辑模式）', '内模式（存储模式）', '物理文件'],
			correct: 0,
			explanation:
				'三级模式：外模式（用户的局部视图）→ 模式（全库逻辑结构）→ 内模式（物理存储）。用户只与外模式打交道。'
		},
		{
			prompt: '保证应用程序与存储结构独立性的机制是？',
			options: ['外模式/模式映像', '模式/内模式映像', '视图定义', '索引'],
			correct: 1,
			explanation:
				'模式/内模式映像实现物理独立性：存储结构改变时只改映像，逻辑模式与应用程序不变；外模式/模式映像实现逻辑独立性。'
		},
		{
			prompt: 'MySQL 属于哪种数据模型？',
			options: ['层次模型', '网状模型', '关系模型', '对象模型'],
			correct: 2,
			explanation: 'MySQL 是关系型数据库管理系统，数据以二维表组织，用 SQL 操作。'
		},
		{
			prompt: '数据库系统（DBS）的核心组成不包括？',
			options: ['数据库（DB）', '数据库管理系统（DBMS）', '应用程序与用户', '编译器'],
			correct: 3,
			explanation:
				'DBS = DB + DBMS + 应用程序 + 用户（DBA/终端用户）+ 支撑平台；编译器不是数据库系统组件。'
		}
	];
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§01</span>
			<span class="section-name">数据库基础</span>
		</div>
		<h1 class="page-title">数据库系统概述</h1>
		<p class="page-desc">
			数据库系统（DBS）是<b>数据库</b>（DB）、<b>数据库管理系统</b>（DBMS）、应用程序与用户的整体。
			核心概念：数据模型——如何描述现实世界；三级模式结构——用户、逻辑、物理三层的隔离。
		</p>
	</div>

	<section class="concept-grid">
		<article class="concept-card">
			<h2 class="concept-title">数据模型</h2>
			<p class="concept-body">
				数据模型是现实世界的抽象，描述数据的结构、操作与约束。三大经典模型：
			</p>
			<div class="model-row">
				<div class="model-cell">
					<span class="model-name">层次模型</span>
					<span class="model-desc">树形结构，有且仅有一个根结点，如 组织架构</span>
				</div>
				<div class="model-cell">
					<span class="model-name">网状模型</span>
					<span class="model-desc">图结构，允许结点有多个父结点，如 课程先修关系</span>
				</div>
				<div class="model-cell">
					<span class="model-name accent">关系模型</span>
					<span class="model-desc">二维表，用户只面对表，用 SQL 操作（MySQL 采用）</span>
				</div>
			</div>
		</article>

		<article class="concept-card">
			<h2 class="concept-title">三级模式结构</h2>
			<p class="concept-body">把数据描述分成三层，用两级映像解耦，实现数据独立性：</p>
			<div class="schema-stack">
				<div class="schema-layer user">外模式（子模式）—— 每个用户看到的局部视图</div>
				<div class="schema-arrow">外模式/模式映像 —— 保证<b>逻辑独立性</b></div>
				<div class="schema-layer logic">模式（逻辑模式）—— 全库的逻辑结构（一个库一个模式）</div>
				<div class="schema-arrow">模式/内模式映像 —— 保证<b>物理独立性</b></div>
				<div class="schema-layer phys">内模式（存储模式）—— 数据在磁盘上的物理存储方式</div>
			</div>
		</article>

		<article class="concept-card">
			<h2 class="concept-title">数据库管理系统（DBMS）</h2>
			<p class="concept-body">位于用户与操作系统之间，提供四大功能：</p>
			<ul class="func-list">
				<li><b>数据定义</b> —— CREATE TABLE / VIEW / INDEX</li>
				<li><b>数据操纵</b> —— SELECT / INSERT / UPDATE / DELETE</li>
				<li><b>数据库运行管理</b> —— 并发控制、安全性、完整性约束</li>
				<li><b>数据库的建立与维护</b> —— 备份、恢复、性能监控</li>
			</ul>
		</article>
	</section>
	<ConceptQuiz items={QUIZ} />
</div>

<style>
	.page {
		max-width: min(1080px, 100%);
		margin: 0 auto;
		padding: 48px 32px 64px;
		min-height: calc(100vh - 48px);
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

	.concept-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin-bottom: 48px;
	}

	.concept-card {
		border: 1px solid var(--color-line-hair);
		border-radius: 8px;
		background: var(--color-surface);
		-webkit-backdrop-filter: blur(12px) saturate(1.4);
		backdrop-filter: blur(12px) saturate(1.4);
		padding: 20px;
	}

	.concept-title {
		font-size: 15px;
		font-weight: 600;
		margin: 0 0 10px 0;
		color: var(--color-ink);
	}

	.concept-body {
		font-size: 13px;
		line-height: 1.7;
		color: var(--color-ink-2);
		margin: 0 0 14px 0;
	}

	.model-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.model-cell {
		border: 1px solid var(--color-line-hair);
		border-radius: 6px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.model-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-ink);
	}

	.model-name.accent {
		color: var(--color-accent);
	}

	.model-desc {
		font-size: 12px;
		line-height: 1.6;
		color: var(--color-ink-3);
	}

	.schema-stack {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.schema-layer {
		border-radius: 6px;
		padding: 10px 12px;
		font-size: 13px;
		line-height: 1.6;
	}

	.schema-layer.user {
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
		color: var(--color-ink);
	}

	.schema-layer.logic {
		background: color-mix(in srgb, var(--color-academic) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-academic) 35%, transparent);
		color: var(--color-ink);
	}

	.schema-layer.phys {
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-success) 35%, transparent);
		color: var(--color-ink);
	}

	.schema-arrow {
		font-size: 12px;
		color: var(--color-ink-3);
		text-align: center;
	}

	.func-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.func-list li {
		font-size: 13px;
		line-height: 1.6;
		color: var(--color-ink-2);
	}
</style>

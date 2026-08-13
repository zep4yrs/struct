<script lang="ts">
	import ConceptQuiz, { type QuizItem } from '$lib/components/ui/ConceptQuiz.svelte';

	const QUIZ: QuizItem[] = [
		{
			prompt: '授予用户查询权限的 SQL 语句是？',
			options: [
				'GRANT SELECT ON 学生 TO user1',
				'CREATE USER user1',
				'REVOKE SELECT ON 学生 FROM user1',
				'ALTER USER user1'
			],
			correct: 0,
			explanation:
				'GRANT 授予权限：GRANT 权限 ON 对象 TO 用户；REVOKE 收回权限，CREATE USER 只创建账号。'
		},
		{
			prompt: '「最小权限原则」的含义是？',
			options: [
				'只给用户完成工作所需的最少权限',
				'所有用户权限相同',
				'权限越多越好',
				'只给管理员权限'
			],
			correct: 0,
			explanation: '最小权限原则：每个用户只拥有完成本职任务必需的最少权限，降低误操作与越权风险。'
		},
		{
			prompt: '关于角色（ROLE）的说法正确的是？',
			options: [
				'角色是一组权限的集合，可批量授予用户',
				'角色是数据库用户',
				'角色只能有一个权限',
				'角色不能撤销'
			],
			correct: 0,
			explanation:
				'角色 = 权限集合（如「教务管理员」含增删改查权限）。把角色授予多个用户即可批量赋权，便于集中管理。'
		},
		{
			prompt: '数据库备份的主要目的是？',
			options: ['防止数据丢失，支持故障恢复', '提高查询速度', '压缩数据库体积', '限制用户访问'],
			correct: 0,
			explanation:
				'备份把数据复制到安全位置；故障（误删/硬件损坏）时用备份恢复，配合日志可将损失降到最低。'
		}
	];
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§09</span>
			<span class="section-name">安全管理</span>
		</div>
		<h1 class="page-title">用户与权限管理</h1>
		<p class="page-desc">
			数据库安全管理的两大手段：<b>用户管理</b>（谁能登录、从哪登录）与<b>权限管理</b
			>（登录后能做什么）。 MySQL 用 <span class="mono">GRANT / REVOKE</span> 授权，用<b>角色</b
			>批量赋权；定期<b>备份恢复</b>保障数据安全。
		</p>
	</div>

	<section class="concept-grid">
		<article class="concept-card">
			<h2 class="concept-title">用户管理</h2>
			<div class="sql-line">
				<span class="sql-key">CREATE USER</span> 'student'@'%' IDENTIFIED BY 'pwd';
			</div>
			<div class="sql-line"><span class="sql-key">DROP USER</span> 'student'@'%';</div>
			<p class="concept-body">
				用户由 <b>用户名 + 主机</b>（@'host'）唯一标识：<span class="mono"
					>'student'@'localhost'</span
				>
				仅限本机、
				<span class="mono">'student'@'%'</span> 允许任意主机。删除用户用 DROP USER。
			</p>
		</article>

		<article class="concept-card">
			<h2 class="concept-title">权限管理 GRANT / REVOKE</h2>
			<div class="sql-line">
				<span class="sql-key">GRANT SELECT, INSERT</span> ON 学生 TO 'student'@'%';
			</div>
			<div class="sql-line">
				<span class="sql-key">REVOKE INSERT</span> ON 学生 FROM 'student'@'%';
			</div>
			<p class="concept-body">
				权限按 <b>对象级</b>（表/视图/列）与 <b>系统级</b>（CREATE DATABASE 等）划分。遵循<b
					>最小权限原则</b
				>：只授予完成工作所需的最少权限。
			</p>
		</article>

		<article class="concept-card">
			<h2 class="concept-title">角色与备份恢复</h2>
			<ul class="func-list">
				<li><b>角色 ROLE</b> —— 权限的集合：创建角色→给角色授权→把角色授予用户，批量管理</li>
				<li><b>备份</b> —— <span class="mono">mysqldump -u root 数据库 &gt; backup.sql</span></li>
				<li><b>恢复</b> —— <span class="mono">mysql -u root 数据库 &lt; backup.sql</span></li>
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
		margin: 0;
	}

	.sql-line {
		font-family: var(--font-mono);
		font-size: 12.5px;
		background: var(--color-paper);
		border: 1px solid var(--color-line-hair);
		border-radius: 6px;
		padding: 8px 12px;
		margin-bottom: 8px;
		color: var(--color-ink-2);
		overflow-x: auto;
		white-space: nowrap;
	}

	.sql-key {
		color: var(--color-accent);
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

	.mono {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-academic);
	}
</style>

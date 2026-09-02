<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';
	import { reveal } from '$lib/utils/motion';
	import { dsTopics, dbTopics } from '$lib/content/topics';
	import { QUIZ_BANK } from '$lib/content/quiz-bank';

	const topicTotal = dsTopics.length + dbTopics.length;
	const RACE_ENGINES = 30;
	const FUN_ENGINES = 9;

	// 赞赏入口（与根 README 徽章共用；替换为你的爱发电主页或 GitHub Sponsors）
	const SPONSOR_URL = 'https://afdian.net/a/zep4yrs';
</script>

<div class="mx-auto max-w-7xl px-8 py-16">
	<section class="mb-16 border-b pb-12" style="border-color: var(--color-line-hair);">
		<div class="mb-8 flex items-end gap-6" use:reveal>
			<Logo size={56} />
			<h1
				class="font-display text-5xl leading-none font-medium"
				style="letter-spacing: -0.03em; color: var(--color-ink);"
			>
				关于 StructVis
			</h1>
		</div>
		<p
			class="max-w-2xl font-display text-2xl font-normal"
			style="color: var(--color-ink-2);"
			use:reveal={{ delay: 150 }}
		>
			「看见数据结构与数据库的每一步跳动。」
		</p>

		<!-- 关键数字（全部从源码派生，与内容单源同步） -->
		<div class="mt-10 flex flex-wrap gap-x-10 gap-y-4" use:reveal={{ delay: 300 }}>
			<div class="stat-chip">
				<b>{topicTotal}</b><span>个知识点</span>
			</div>
			<div class="stat-chip"><b>{dsTopics.length}</b><span>数据结构 · 李春葆教材</span></div>
			<div class="stat-chip"><b>{dbTopics.length}</b><span>MySQL · 杨宏霞教材</span></div>
			<div class="stat-chip"><b>{RACE_ENGINES}</b><span>竞速排序引擎</span></div>
			<div class="stat-chip"><b>{QUIZ_BANK.length}</b><span>自测题库</span></div>
			<div class="stat-chip"><b>100%</b><span>本地存储 · 零上传</span></div>
		</div>
	</section>

	<section class="mb-16">
		<h2 class="mb-6 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
			为什么做这个
		</h2>
		<p class="mb-4 max-w-3xl text-base leading-relaxed" style="color: var(--color-ink-2);">
			自学数据结构和数据库时，最痛苦的不是语法记不住，而是脑子里想象不出过程。看书上的静态图示，看完好像懂了，一做题就错；跟着视频学，看起来很顺，自己写就卡壳。
		</p>
		<p class="mb-4 max-w-3xl text-base leading-relaxed" style="color: var(--color-ink-2);">
			StructVis
			的存在就是为了解决这个问题——把抽象的算法过程变成可交互、可步进、可自己动手试的可视化练习，让自学者不靠老师也能把每个步骤搞明白。
		</p>
	</section>

	<section class="mb-16">
		<h2 class="mb-6 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
			功能全景
		</h2>
		<div class="feature-grid">
			<div class="feature-block">
				<h3>学习 · 可视化</h3>
				<ul>
					<li>{dsTopics.length} 个数据结构知识点：排序 / 树 / 图 / 线性结构 / 查找 / 动态规划</li>
					<li>{dbTopics.length} 个 MySQL 知识点：查询 / 窗口函数 / 执行计划 / 事务 / 范式等</li>
					<li>步进播放器：逐帧、回放、调速、跳步、断点，动画与伪代码同步高亮</li>
					<li>动手模式：先预测下一步，再亲手点选验证</li>
				</ul>
			</div>
			<div class="feature-block">
				<h3>练习 · 复习闭环</h3>
				<ul>
					<li>四类题型：选择 / 填空 / 拖指针 / 补代码，答错立刻给正确答案与解析</li>
					<li>错题本自动收集，SRS 间隔复习排期（到期提醒）</li>
					<li>每日一题：全站每天同一题，60 秒微学习</li>
					<li>章节自测：{QUIZ_BANK.length} 道题按章随机抽题限时作答，成绩回写掌握度</li>
				</ul>
			</div>
			<div class="feature-block">
				<h3>竞技 · 洞察</h3>
				<ul>
					<li>
						竞速实验室：{RACE_ENGINES}
						个排序引擎同屏竞速——{RACE_ENGINES - FUN_ENGINES}
						条经典跑道 + {FUN_ENGINES} 条玩梗跑道（Stalin / Thanos / 量子 Bogo…）
					</li>
					<li>技能图谱：知识点前置依赖网络，规划学习路径</li>
					<li>掌握度雷达、学习热力图、一键生成学习报告</li>
				</ul>
			</div>
			<div class="feature-block">
				<h3>讲授 · 分享</h3>
				<ul>
					<li>投影模式：全屏大字号旁白，键盘翻页，适合课堂大屏</li>
					<li>讲授剧本：每步旁白可导入 / 导出 / 重置，配套预录语音朗读</li>
					<li>状态分享链接：复制 URL 即恢复当前输入、步数与速度</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="mb-16">
		<h2 class="mb-6 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
			不是什么
		</h2>
		<ul class="max-w-3xl list-disc space-y-2 pl-6 text-base" style="color: var(--color-ink-2);">
			<li>不是通用算法可视化网站（不是给所有人看的炫技 Demo）</li>
			<li>不是在线 IDE（不是用来写项目的）</li>
			<li>不是题库平台（不刷无解析的选择题）</li>
			<li>不是课程平台（不卖课、不做视频）</li>
			<li>没有账号体系——进度只存在你的浏览器里，可随时导出备份</li>
		</ul>
	</section>

	<section class="mb-16">
		<h2 class="mb-6 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">是什么</h2>
		<ul class="max-w-3xl list-disc space-y-2 pl-6 text-base" style="color: var(--color-ink-2);">
			<li>教材对齐的自学辅助工具 — 跟着《数据结构教程》和《数据库技术及应用（MySQL）》的章节走</li>
			<li>交互式步进可视化 — 不是看动画，是每一步都可以暂停、可以自己操作、可以试错</li>
			<li>即时反馈的练习系统 — 做错了立刻告诉你为什么错，不是只给一个答案</li>
			<li>本地进度追踪 — 学到哪了、掌握了多少、错了哪些，全在本地存着，支持导入导出备份</li>
		</ul>
	</section>

	<section class="mb-16">
		<h2 class="mb-6 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">技术栈</h2>
		<ul class="max-w-3xl list-disc space-y-2 pl-6 text-base" style="color: var(--color-ink-2);">
			<li>Svelte 5 + SvelteKit（adapter-static 纯静态部署，GitHub Pages）</li>
			<li>Tailwind v4 + 自研设计 token（亮 / 暗双主题，AA 对比度基线）</li>
			<li>Canvas 渲染器插件体系 + anime.js v4 时间线动画与数据动效</li>
			<li>
				three.js 全站粒子背景（可在设置中关闭）· SQL 剧本引擎（sql.js 逐帧真实执行，可选依赖）
			</li>
			<li>Web Speech API 讲授朗读（含预录神经语音回落）</li>
			<li>Vitest（553 单测）+ Playwright（61 条端到端，含视觉截图基线）</li>
		</ul>
	</section>

	<section class="mb-16">
		<h2 class="mb-6 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
			数据与隐私
		</h2>
		<p class="max-w-3xl text-base leading-relaxed" style="color: var(--color-ink-2);">
			掌握度、错题本、连续学习天数等所有学习数据仅保存在你的浏览器 localStorage
			中，不上传任何服务器。进度页提供一键导出 /
			导入备份；隐私模式下若写入失败会明确提示，绝不静默丢数据。
		</p>
	</section>

	<section class="mb-16">
		<h2 class="mb-6 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
			支持项目
		</h2>
		<p class="mb-5 max-w-3xl text-base leading-relaxed" style="color: var(--color-ink-2);">
			StructVis
			的全部学习功能永久免费。如果你觉得它帮到了你，欢迎请作者喝杯咖啡——服务器、题库更新与新课程开发都靠这份支持续命。
		</p>
		<a class="sponsor-btn" href={SPONSOR_URL} target="_blank" rel="noopener noreferrer" use:reveal>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path
					d="M12 21s-7.5-4.9-9.7-9.2C.6 8.4 2.3 5 5.6 5c1.9 0 3.3 1 4.1 2.4L12 10l2.3-2.6C15.1 6 16.5 5 18.4 5c3.3 0 5 3.4 3.3 6.8C19.5 16.1 12 21 12 21z"
				/>
			</svg>
			爱发电 · 请作者喝杯咖啡
		</a>
	</section>

	<section class="mb-16">
		<h2 class="mb-6 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
			开源协议
		</h2>
		<p class="max-w-3xl text-base leading-relaxed" style="color: var(--color-ink-2);">
			本项目以 GPL-3.0（GNU General Public License v3.0）开源，Copyright (c) 2026 枫桥
			(zep4yrs)。你可以自由使用、修改、分发本项目，但基于本项目的衍生作品必须同样以 GPL-3.0
			开源——防止有人拿去闭源商用。完整许可文本见仓库 LICENSE 文件。
		</p>
	</section>

	<footer
		class="mt-20 flex items-center justify-between border-t pt-8 font-mono text-[11px] tracking-wider uppercase"
		style="border-color: var(--color-line-hair); color: var(--color-ink-3); letter-spacing: 0.08em;"
	>
		<span>StructVis</span>
		<span>© 2026 枫桥 (zep4yrs)</span>
	</footer>
</div>

<style>
	.stat-chip {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.stat-chip b {
		font-family: var(--font-mono);
		font-size: 22px;
		font-weight: 600;
		color: var(--color-accent-text);
	}

	.stat-chip span {
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 28px;
		max-width: 1080px;
	}

	.feature-block {
		padding: 18px 22px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		-webkit-backdrop-filter: blur(10px) saturate(1.4);
		backdrop-filter: blur(10px) saturate(1.4);
	}

	.feature-block h3 {
		font-family: var(--font-display);
		font-size: 17px;
		font-weight: 600;
		margin: 0 0 12px;
		color: var(--color-ink);
	}

	.feature-block ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.feature-block li {
		position: relative;
		padding-left: 14px;
		font-size: 13px;
		line-height: 1.7;
		color: var(--color-ink-2);
	}

	.feature-block li::before {
		content: '·';
		position: absolute;
		left: 2px;
		color: var(--color-accent-text);
		font-weight: 700;
	}

	.sponsor-btn {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 12px 24px;
		border-radius: var(--radius-md);
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		font-size: 15px;
		font-weight: 500;
		text-decoration: none;
		transition:
			transform 0.2s var(--ease-out),
			box-shadow 0.2s var(--ease-out),
			background-color 0.2s var(--ease-out);
	}

	.sponsor-btn:hover {
		background: #b45309;
		color: #fff;
		transform: translateY(-2px);
		box-shadow: 0 12px 28px -12px rgba(180, 83, 9, 0.55);
	}

	.sponsor-btn svg {
		color: currentColor;
	}

	@media (max-width: 860px) {
		.feature-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

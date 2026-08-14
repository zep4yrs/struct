<script lang="ts">
	import { progress } from '$lib/stores/progress';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/utils/motion';

	// === 报告数据 ===
	const topics = $derived(Object.entries($progress.topics));
	const masteredCount = $derived(topics.filter(([, t]) => t.mastery >= 80).length);
	const totalExercises = $derived(topics.reduce((a, [, t]) => a + t.totalExercises, 0));
	const correctExercises = $derived(topics.reduce((a, [, t]) => a + t.correctExercises, 0));
	const accuracy = $derived(
		totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0
	);
	const avgMastery = $derived(
		topics.length > 0
			? Math.round(topics.reduce((a, [, t]) => a + t.mastery, 0) / topics.length)
			: 0
	);
	const mistakeCount = $derived($progress.mistakes.length);
	const pendingReview = $derived($progress.mistakes.filter((m) => !m.mastered).length);
	const streakDays = $derived($progress.streakDays);

	// 环形图：平均掌握度
	const RING_R = 84;
	const RING_C = 2 * Math.PI * RING_R;
	const ringDash = $derived((avgMastery / 100) * RING_C);

	function todayStr(): string {
		const d = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		return d.getFullYear() + ' 年 ' + pad(d.getMonth() + 1) + ' 月 ' + pad(d.getDate()) + ' 日';
	}

	// === 下载 PNG：canvas 重绘报告卡（1200×630 社交图尺寸） ===
	async function downloadPng() {
		const W = 1200;
		const H = 630;
		const canvas = document.createElement('canvas');
		canvas.width = W;
		canvas.height = H;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// 背景：深色渐变（与站点主题呼应）
		const bg = ctx.createLinearGradient(0, 0, W, H);
		bg.addColorStop(0, '#161514');
		bg.addColorStop(1, '#1e2a33');
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, W, H);

		// 顶部装饰线
		ctx.fillStyle = '#d97706';
		ctx.fillRect(0, 0, W, 6);

		// 标题
		ctx.fillStyle = '#e9e6e0';
		ctx.font = '600 44px "PingFang SC", "Microsoft YaHei", sans-serif';
		ctx.fillText('StructVis 学习报告', 72, 96);
		ctx.fillStyle = '#a6a39b';
		ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
		ctx.fillText(todayStr(), 72, 136);

		// 环形掌握度
		const cx = 320;
		const cy = 380;
		ctx.lineWidth = 22;
		ctx.strokeStyle = '#2c2a27';
		ctx.beginPath();
		ctx.arc(cx, cy, RING_R, 0, Math.PI * 2);
		ctx.stroke();
		ctx.strokeStyle = '#d97706';
		ctx.beginPath();
		ctx.arc(cx, cy, RING_R, -Math.PI / 2, -Math.PI / 2 + (ringDash / RING_C) * Math.PI * 2);
		ctx.stroke();
		ctx.fillStyle = '#e9e6e0';
		ctx.font = '600 56px "PingFang SC", sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(avgMastery + '%', cx, cy + 14);
		ctx.fillStyle = '#a6a39b';
		ctx.font = '20px "PingFang SC", sans-serif';
		ctx.fillText('平均掌握度', cx, cy + 52);

		// 右侧统计
		ctx.textAlign = 'left';
		const stats: [string, string | number][] = [
			['已掌握主题', masteredCount + ' / ' + topics.length],
			['累计练习', totalExercises + ' 题'],
			['正确率', accuracy + '%'],
			['连续学习', streakDays + ' 天'],
			['错题本', mistakeCount + ' 道（' + pendingReview + ' 待复习）']
		];
		let sy = 300;
		for (const [label, value] of stats) {
			ctx.fillStyle = '#a6a39b';
			ctx.font = '20px "PingFang SC", sans-serif';
			ctx.fillText(label, 560, sy);
			ctx.fillStyle = '#e9e6e0';
			ctx.font = '600 26px "PingFang SC", sans-serif';
			ctx.fillText(String(value), 740, sy);
			sy += 62;
		}

		// 底部
		ctx.fillStyle = '#6b6861';
		ctx.font = '18px "PingFang SC", sans-serif';
		ctx.textAlign = 'right';
		ctx.fillText('看见数据结构与数据库的每一步跳动', W - 72, H - 48);

		const url = canvas.toDataURL('image/png');
		const a = document.createElement('a');
		a.href = url;
		a.download = 'structvis-report.png';
		a.click();
	}
</script>

<div class="mx-auto max-w-3xl p-8">
	<div class="section-label mb-4" use:reveal>学习报告 · REPORT</div>
	<h1
		class="mb-2 font-display text-5xl font-medium"
		style="letter-spacing: -0.03em;"
		use:reveal={{ delay: 90 }}
	>
		我的学习报告
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2);" use:reveal={{ delay: 160 }}>
		{todayStr()} · 数据来自本地学习记录
	</p>

	<!-- 报告卡 -->
	<div class="report-card glass" use:reveal>
		<div class="report-head">
			<div>
				<div class="report-brand">StructVis</div>
				<div class="report-slogan">看见数据结构与数据库的每一步跳动</div>
			</div>
			<div class="report-date">{todayStr()}</div>
		</div>

		<div class="report-body">
			<!-- 环形掌握度 -->
			<div class="report-ring-wrap">
				<svg width="200" height="200" viewBox="0 0 200 200">
					<circle
						cx="100"
						cy="100"
						r={RING_R}
						fill="none"
						stroke="var(--color-subtle)"
						stroke-width="22"
					/>
					<circle
						cx="100"
						cy="100"
						r={RING_R}
						fill="none"
						stroke="var(--color-accent)"
						stroke-width="22"
						stroke-linecap="round"
						stroke-dasharray="{ringDash} {RING_C}"
						transform="rotate(-90 100 100)"
					/>
					<text x="100" y="106" text-anchor="middle" class="report-ring-num">{avgMastery}%</text>
					<text x="100" y="132" text-anchor="middle" class="report-ring-label">平均掌握度</text>
				</svg>
			</div>

			<!-- 统计 -->
			<div class="report-stats">
				<div class="report-stat">
					<span class="report-stat-label">已掌握主题</span>
					<span class="report-stat-num">{masteredCount}<i>/{topics.length}</i></span>
				</div>
				<div class="report-stat">
					<span class="report-stat-label">累计练习</span>
					<span class="report-stat-num">{totalExercises}<i>题</i></span>
				</div>
				<div class="report-stat">
					<span class="report-stat-label">正确率</span>
					<span class="report-stat-num">{accuracy}<i>%</i></span>
				</div>
				<div class="report-stat">
					<span class="report-stat-label">连续学习</span>
					<span class="report-stat-num">{streakDays}<i>天</i></span>
				</div>
				<div class="report-stat">
					<span class="report-stat-label">错题本</span>
					<span class="report-stat-num">{mistakeCount}<i>道</i></span>
				</div>
				<div class="report-stat">
					<span class="report-stat-label">待复习</span>
					<span class="report-stat-num">{pendingReview}<i>道</i></span>
				</div>
			</div>
		</div>
	</div>

	<div class="report-actions" use:reveal>
		<button class="btn btn-accent" onclick={downloadPng}>⬇ 下载报告图片</button>
		<a href={resolve('/progress')} class="btn btn-ghost">返回学习进度</a>
	</div>

	<p class="report-tip" use:reveal>
		报告卡片适合分享到朋友圈/群里——掌握度、练习量、连续天数一目了然。
	</p>
</div>

<style>
	.report-card {
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-lg);
		padding: 28px 32px;
	}

	.report-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid var(--color-line-hair);
		padding-bottom: 18px;
		margin-bottom: 24px;
	}

	.report-brand {
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}

	.report-slogan {
		font-size: 12px;
		color: var(--color-ink-3);
		margin-top: 4px;
	}

	.report-date {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
	}

	.report-body {
		display: flex;
		flex-wrap: wrap;
		gap: 32px;
		align-items: center;
	}

	.report-ring-wrap {
		flex-shrink: 0;
	}

	.report-ring-num {
		font-family: var(--font-display);
		font-size: 36px;
		font-weight: 600;
		fill: var(--color-ink);
	}

	.report-ring-label {
		font-family: var(--font-mono);
		font-size: 11px;
		fill: var(--color-ink-3);
	}

	.report-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(110px, 1fr));
		gap: 18px 24px;
		flex: 1;
		min-width: 280px;
	}

	.report-stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.report-stat-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
	}

	.report-stat-num {
		font-family: var(--font-display);
		font-size: 30px;
		font-weight: 500;
		line-height: 1;
		color: var(--color-ink);
	}

	.report-stat-num i {
		font-style: normal;
		font-size: 14px;
		color: var(--color-ink-3);
		margin-left: 4px;
	}

	.report-actions {
		display: flex;
		gap: 10px;
		margin-top: 20px;
	}

	.report-tip {
		margin-top: 14px;
		font-size: 12px;
		color: var(--color-ink-3);
	}
</style>

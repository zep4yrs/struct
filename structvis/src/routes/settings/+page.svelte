<script lang="ts">
	import { settings, toggleTheme } from '$lib/stores/settings';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/utils/motion';

	let speed = $state($settings.animationSpeed);
	let showHints = $state($settings.showHints);
	let particles = $state($settings.particleBackground);
	let openingAnim = $state($settings.openingAnimation);
	let openingSnd = $state($settings.openingSound);
	// 通知权限状态（用于模板判断；授权后刷新显示）
	let notifPermission = $state(
		typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
	);

	async function requestNotification() {
		if (typeof Notification === 'undefined') return;
		try {
			notifPermission = await Notification.requestPermission();
		} catch {
			notifPermission = Notification.permission;
		}
	}

	function save() {
		settings.update((s) => ({
			...s,
			animationSpeed: speed,
			showHints,
			particleBackground: particles,
			openingAnimation: openingAnim,
			openingSound: openingSnd
		}));
	}

	$effect(() => {
		save();
	});
</script>

<svelte:head><title>设置 · StructVis</title></svelte:head>

<div class="page">
	<div class="section-header" use:reveal>
		<div class="section-label">设置 · SETTINGS</div>
		<h1 class="page-title">我的</h1>
		<p class="page-desc">学习记录入口与界面偏好，所有数据自动保存到浏览器本地存储。</p>
	</div>

	<!-- v3 聚合入口：报告 / 图谱 / 关于 -->
	<nav class="me-links" aria-label="我的入口">
		<a class="me-link liquid" href={resolve('/progress')}>
			<span class="me-link-title">学习进度</span>
			<span class="me-link-desc">每日一题 · 错题本 · 热力图</span>
		</a>
		<a class="me-link liquid" href={resolve('/report')}>
			<span class="me-link-title">学习报告</span>
			<span class="me-link-desc">掌握度雷达 · 弱项分析 · 分享图</span>
		</a>
		<a class="me-link liquid" href={resolve('/quiz')}>
			<span class="me-link-title">章节自测</span>
			<span class="me-link-desc">随机抽题 · 限时作答</span>
		</a>
		<a class="me-link liquid" href={resolve('/about')}>
			<span class="me-link-title">关于</span>
			<span class="me-link-desc">产品说明 · 技术栈</span>
		</a>
	</nav>

	<h2 class="prefs-label">偏好设置</h2>
	<div class="settings-list">
		<div class="setting-item liquid">
			<div class="setting-info">
				<div class="setting-label">动画速度</div>
				<div class="setting-desc">播放器步进动画的播放速率（0.5× ~ 2×）</div>
			</div>
			<div class="setting-control">
				<input type="range" min="0.5" max="2" step="0.25" bind:value={speed} class="speed-range" />
				<span class="speed-value">{speed}×</span>
			</div>
		</div>

		<div class="setting-item liquid">
			<div class="setting-info">
				<div class="setting-label">显示提示</div>
				<div class="setting-desc">练习模式默认显示 hint 按钮</div>
			</div>
			<div class="setting-control">
				<label class="toggle">
					<input type="checkbox" bind:checked={showHints} />
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>

		<div class="setting-item liquid">
			<div class="setting-info">
				<div class="setting-label">粒子背景</div>
				<div class="setting-desc">全站 3D 粒子动效背景；低配设备或省电场景建议关闭</div>
			</div>
			<div class="setting-control">
				<label class="toggle">
					<input type="checkbox" bind:checked={particles} />
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>

		<div class="setting-item liquid">
			<div class="setting-info">
				<div class="setting-label">开屏动画</div>
				<div class="setting-desc">首次访问首页的品牌开场动画（可跳过）；回访不再播放</div>
			</div>
			<div class="setting-control">
				<label class="toggle">
					<input type="checkbox" bind:checked={openingAnim} />
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>

		<div class="setting-item liquid">
			<div class="setting-info">
				<div class="setting-label">开屏音效</div>
				<div class="setting-desc">
					开屏动画的合成音效（无声卡/低电量场景可关；浏览器首次访问需点击解锁）
				</div>
			</div>
			<div class="setting-control">
				<label class="toggle">
					<input type="checkbox" bind:checked={openingSnd} />
					<span class="toggle-slider"></span>
				</label>
			</div>
		</div>

		<div class="setting-item liquid">
			<div class="setting-info">
				<div class="setting-label">主题</div>
				<div class="setting-desc">当前主题：{$settings.theme === 'dark' ? '暗色' : '亮色'}</div>
			</div>
			<div class="setting-control">
				<button class="btn btn-primary" onclick={toggleTheme}>
					切换到{$settings.theme === 'dark' ? '亮色' : '暗色'}主题
				</button>
			</div>
		</div>

		<div class="setting-item liquid">
			<div class="setting-info">
				<div class="setting-label">学习提醒</div>
				<div class="setting-desc">错题到期时发送浏览器通知（每天一次）</div>
			</div>
			<div class="setting-control">
				{#if notifPermission === 'granted'}
					<span class="notif-status on">已开启</span>
				{:else if notifPermission === 'denied'}
					<span class="notif-status off">已禁用（请在浏览器设置中允许）</span>
				{:else if notifPermission === 'unsupported'}
					<span class="notif-status off">当前浏览器不支持通知</span>
				{:else}
					<button class="btn btn-ghost" onclick={requestNotification}>开启提醒</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		max-width: min(1100px, 100%);
		margin: 0 auto;
		padding: 48px 32px 64px;
		min-height: calc(100vh - 48px);
	}

	.section-header {
		margin-bottom: 32px;
	}

	/* 眉标走全局 .section-label（与全站一致），此处不再覆盖 */

	.page-title {
		font-size: 32px;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0 0 12px;
	}

	.page-desc {
		font-size: 15px;
		line-height: 1.7;
		color: var(--color-ink-2);
		max-width: 560px;
		margin: 0;
	}

	/* v3 我的聚合入口 */
	.me-links {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 10px;
		margin-bottom: 28px;
	}

	.me-link {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 14px 16px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		text-decoration: none;
		transition:
			border-color 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}

	.me-link:hover {
		border-color: var(--color-accent);
		box-shadow: 0 4px 16px rgba(217, 119, 6, 0.1);
	}

	.me-link-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
	}

	.me-link-desc {
		font-size: 11.5px;
		color: var(--color-ink-2);
	}

	.prefs-label {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-ink);
		margin: 0 0 14px;
	}

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.notif-status {
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.notif-status.on {
		color: var(--color-success);
	}

	.notif-status.off {
		color: var(--color-ink-3);
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		padding: 20px 24px;
		border-radius: var(--radius-md);
		background: transparent; /* 磨砂底交给 .liquid（--glass-tint） */
		border: none; /* 边框由 .liquid 承担（重复边框会加粗） */
	}

	.setting-info {
		flex: 1;
	}

	.setting-label {
		font-size: 15px;
		font-weight: 600;
		margin-bottom: 4px;
	}

	.setting-desc {
		font-size: 13px;
		color: var(--color-ink-2);
		line-height: 1.5;
	}

	.setting-control {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.speed-range {
		width: 140px;
		accent-color: var(--color-academic);
	}

	.speed-value {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--color-ink);
		min-width: 36px;
		text-align: center;
	}

	.toggle {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
		cursor: pointer;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		inset: 0;
		background: var(--color-line-regular);
		border-radius: 24px;
		transition: background 0.2s;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		left: 3px;
		top: 3px;
		width: 18px;
		height: 18px;
		background: #fff;
		border-radius: 50%;
		transition: transform 0.2s;
	}

	.toggle input:checked + .toggle-slider {
		background: var(--color-academic);
	}

	.toggle input:checked + .toggle-slider::before {
		transform: translateX(20px);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: var(--radius-sm);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.btn-primary {
		background: var(--color-academic);
		color: #fff;
	}

	/* 暗色下学术蓝变浅，白字对比不足（2.57:1 < 4.5:1）→ 用墨字 */
	:global(.dark) .btn-primary {
		color: var(--color-ink-inverse);
	}

	.btn-primary:hover {
		background: var(--color-academic);
		filter: brightness(1.1);
	}
</style>

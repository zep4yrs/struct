<script lang="ts">
	import { settings, toggleTheme } from '$lib/stores/settings';
	import { reveal } from '$lib/utils/motion';

	let speed = $state($settings.animationSpeed);
	let showHints = $state($settings.showHints);
	let particles = $state($settings.particleBackground);
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
			particleBackground: particles
		}));
	}

	$effect(() => {
		save();
	});
</script>

<div class="page">
	<div class="section-header" use:reveal>
		<div class="section-label">
			<span class="section-num">设</span>
			<span class="section-name">偏好</span>
		</div>
		<h1 class="page-title">设置</h1>
		<p class="page-desc">调整播放器行为与界面偏好，所有设置自动保存到浏览器本地存储。</p>
	</div>

	<div class="settings-list">
		<div class="setting-item">
			<div class="setting-info">
				<div class="setting-label">动画速度</div>
				<div class="setting-desc">播放器步进动画的播放速率（0.5× ~ 2×）</div>
			</div>
			<div class="setting-control">
				<input type="range" min="0.5" max="2" step="0.25" bind:value={speed} class="speed-range" />
				<span class="speed-value">{speed}×</span>
			</div>
		</div>

		<div class="setting-item">
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

		<div class="setting-item">
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

		<div class="setting-item">
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

		<div class="setting-item">
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
		max-width: min(720px, 100%);
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
		gap: 8px;
	}

	.section-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-sm);
		background: var(--color-academic);
		color: #fff;
		font-size: 11px;
		font-weight: 600;
	}

	.section-name {
		font-weight: 500;
	}

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
		background: var(--color-surface);
		border: 1px solid var(--color-line-hair);
		-webkit-backdrop-filter: blur(12px) saturate(1.4);
		backdrop-filter: blur(12px) saturate(1.4);
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

	.btn-primary:hover {
		background: var(--color-academic);
		filter: brightness(1.1);
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import '$lib/styles/app.css';
	import AppLayout from '$lib/components/layout/AppLayout.svelte';
	import Scene3D from '$lib/components/ui/Scene3D.svelte';
	import { base } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { updateStreak, progress, isMistakeDue } from '$lib/stores/progress';
	import { settings } from '$lib/stores/settings';

	let { children } = $props();

	onMount(() => {
		// 页面加载时更新连续学习天数
		updateStreak();
		// SRS 到期提醒（每天一次；未授权通知权限则静默）
		checkDueReminder();
	});

	/** SRS 复习到期提醒：当天首次打开时若有到期错题，发浏览器通知 */
	function checkDueReminder() {
		if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
		const today = new Date().toDateString();
		try {
			if (localStorage.getItem('structvis:reminder-date') === today) return;
			localStorage.setItem('structvis:reminder-date', today);
		} catch {
			return;
		}
		const snapshot = get(progress);
		const due = (snapshot.mistakes ?? []).filter((m) => isMistakeDue(m)).length;
		if (due > 0) {
			new Notification('StructVis · 复习提醒', {
				body: `有 ${due} 道错题今天到期，趁热复习效果最好。`,
				icon: '/struct/favicon.svg'
			});
		}
	}

	// 主题切换：同步 settings.theme 到 <html class="dark">
	$effect(() => {
		document.documentElement.classList.toggle('dark', $settings.theme === 'dark');
	});

	// 浏览器 UI（滚动条/地址栏）颜色跟随主题
	$effect(() => {
		let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
		if (!meta) {
			meta = document.createElement('meta');
			meta.name = 'theme-color';
			document.head.appendChild(meta);
		}
		meta.content = $settings.theme === 'dark' ? '#161514' : '#FCFAF6';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href={`${base}/manifest.webmanifest`} />
</svelte:head>

<Scene3D />
<AppLayout>{@render children()}</AppLayout>

<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/app.css';
	import AppLayout from '$lib/components/layout/AppLayout.svelte';
	import { base } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { updateStreak } from '$lib/stores/progress';
	import { settings } from '$lib/stores/settings';

	let { children } = $props();

	onMount(() => {
		// 页面加载时更新连续学习天数
		updateStreak();
	});

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

<AppLayout>{@render children()}</AppLayout>

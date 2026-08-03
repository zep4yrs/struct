<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/app.css';
	import AppLayout from '$lib/components/layout/AppLayout.svelte';
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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppLayout>{@render children()}</AppLayout>

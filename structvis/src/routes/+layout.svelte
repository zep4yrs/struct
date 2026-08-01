<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/app.css';
	import AppLayout from '$lib/components/layout/AppLayout.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { updateStreak } from '$lib/stores/progress';

	let { children } = $props();

	onMount(() => {
		// 页面加载时更新连续学习天数
		updateStreak();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppLayout>{@render children()}</AppLayout>

<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		SinglyLinkedListEngine,
		type ListEngineInput
	} from '$lib/engines/algorithm/linkedlist/SinglyLinkedListEngine';

	function createEngine(input: ListEngineInput): SinglyLinkedListEngine {
		const e = new SinglyLinkedListEngine();
		e.init(input);
		return e;
	}

	let engine = $state(createEngine({ values: [12, 99, 37, 8], operation: 'insert', target: 3, value: 66 }));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§02</span>
			<span class="section-name">线性结构</span>
		</div>
		<h1 class="page-title">单链表基本操作</h1>
		<p class="page-desc">
			链表用指针链接节点，插入与删除只需要修改前驱的 next 指针，无需移动其他元素。
			关键思想：插入先找前驱，删除先遍历定位。观察下方动画中 <span class="mono">p</span> 指针的移动规律。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="linear-list" topicName="单链表基本操作" />
	</div>
</div>

<style>
	.page {
		max-width: min(1440px, 100%);
		margin: 0 auto;
		padding: 48px 32px 64px;
		min-height: calc(100vh - 48px);
		display: flex;
		flex-direction: column;
	}

	.player-wrap {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 32px;
		margin-bottom: 32px;
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
		max-width: 620px;
		margin: 0;
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-academic);
	}
</style>

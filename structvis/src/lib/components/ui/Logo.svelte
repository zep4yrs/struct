<script lang="ts">
	interface Props {
		size?: number;
	}
	let { size = 24 }: Props = $props();
</script>

<!-- StructVis Logo Mark — 左：数据结构 / 右：数据库 -->
<svg
	width={size}
	height={size}
	viewBox="0 0 56 56"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- ====== 左侧：数据结构（树形） ====== -->
	<!-- 主干 -->
	<rect x="14" y="8" width="3" height="40" rx="1.5" fill="currentColor" />
	<!-- 左分支 -->
	<rect x="8" y="16" width="8" height="2.5" rx="1.25" fill="currentColor" />
	<rect x="4" y="32" width="12" height="2.5" rx="1.25" fill="currentColor" />
	<!-- 右分支 -->
	<rect x="15" y="24" width="8" height="2.5" rx="1.25" fill="currentColor" />
	<!-- 节点 -->
	<circle cx="15.5" cy="6" r="3" fill="var(--color-accent)" />
	<circle cx="6" cy="14" r="3" fill="var(--color-academic)" />
	<circle cx="24" cy="22" r="3" fill="var(--color-academic)" />
	<circle cx="2.5" cy="30" r="3" fill="var(--color-success)" />

	<!-- ====== 右侧：数据库（表/行） ====== -->
	<!-- 表1 -->
	<rect x="30" y="8" width="22" height="8" rx="2" fill="currentColor" opacity="0.15" />
	<rect x="30" y="8" width="22" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
	<line x1="34" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
	<!-- 表2 -->
	<rect x="30" y="20" width="22" height="8" rx="2" fill="currentColor" opacity="0.15" />
	<rect x="30" y="20" width="22" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
	<line x1="34" y1="24" x2="48" y2="24" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
	<!-- 表3 -->
	<rect x="30" y="32" width="22" height="8" rx="2" fill="currentColor" opacity="0.15" />
	<rect x="30" y="32" width="22" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
	<line x1="34" y1="36" x2="48" y2="36" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
	<!-- 表4 -->
	<rect x="30" y="44" width="22" height="8" rx="2" fill="currentColor" opacity="0.15" />
	<rect x="30" y="44" width="22" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
	<line x1="34" y1="48" x2="48" y2="48" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
</svg>
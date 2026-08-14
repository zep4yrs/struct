<script lang="ts">
	import { onMount } from 'svelte';
	import type { WebGLRenderer, Scene as ThreeScene, Object3D, MeshBasicMaterial } from 'three';

	interface MasteryItem {
		title: string;
		mastery: number; // 0-100
		completed: boolean;
	}

	interface Props {
		topics: MasteryItem[];
		/** 平均掌握度（中心大数字） */
		avg: number;
	}

	let { topics, avg }: Props = $props();

	/** three.js 掌握度总览：34 根柱绕环排列，高度 = 主题掌握度。
	 *  - 进入时柱子从 0 生长（错相位）；整体缓慢旋转 + 鼠标视差
	 *  - 颜色：已掌握=绿 / 学习中=琥珀 / 未学=墨灰
	 *  - 懒加载 + WebGL 降级 + 主题联动 + 完整清理
	 */
	let containerEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (typeof window === 'undefined') return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const holder = containerEl;
		if (!holder) return;
		let cleanup = () => {};

		void (async () => {
			try {
				const THREE = await import('three');
				let renderer: WebGLRenderer;
				try {
					renderer = new THREE.WebGLRenderer({
						alpha: true,
						antialias: true,
						powerPreference: 'low-power'
					});
				} catch {
					return; // WebGL 不可用 → 静默降级（中心数字仍由 HTML 显示）
				}

				const scene: ThreeScene = new THREE.Scene();
				const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
				camera.position.set(0, 5.5, 12);
				camera.lookAt(0, 0, 0);

				const readColor = (name: string): number => {
					const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
					return v ? parseInt(v.replace('#', ''), 16) : 0x1a1a1a;
				};

				// === 掌握度柱阵（环形） ===
				const COUNT = Math.max(1, topics.length);
				const RADIUS = 4.6;
				let themeSuccess = new THREE.Color(readColor('--color-success'));
				let themeAccent = new THREE.Color(readColor('--color-accent'));
				let themeInk = new THREE.Color(readColor('--color-ink-3'));
				const bars: {
					mesh: Object3D;
					target: number;
					cur: number;
					delay: number;
					mats: MeshBasicMaterial[];
				}[] = [];
				const group = new THREE.Group();
				const barGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
				for (let i = 0; i < COUNT; i++) {
					const t = topics[i];
					const h = 0.12 + (t.mastery / 100) * 2.7;
					const mat = new THREE.MeshBasicMaterial({
						color: t.completed ? themeSuccess : t.mastery > 0 ? themeAccent : themeInk,
						transparent: true,
						opacity: t.mastery > 0 ? 0.95 : 0.55
					});
					const angle = (i / COUNT) * Math.PI * 2;
					const m = new THREE.Mesh(barGeo, mat);
					m.position.set(Math.cos(angle) * RADIUS, h / 2, Math.sin(angle) * RADIUS);
					m.scale.y = 0.001; // 生长起点
					group.add(m);
					bars.push({ mesh: m, target: h, cur: 0, delay: i * 0.018, mats: [mat] });
				}
				scene.add(group);

				renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
				renderer.setClearColor(0x000000, 0);
				const canvas = renderer.domElement;
				canvas.style.width = '100%';
				canvas.style.height = '100%';
				holder.appendChild(canvas);

				const resize = () => {
					const w = holder.clientWidth || 1;
					const h = holder.clientHeight || 1;
					renderer.setSize(w, h, false);
					camera.aspect = w / h;
					camera.updateProjectionMatrix();
				};
				resize();
				const ro = new ResizeObserver(resize);
				ro.observe(holder);

				// 鼠标视差
				let targetX = 0;
				let targetY = 0;
				let curX = 0;
				let curY = 0;
				const onMove = (e: MouseEvent) => {
					targetX = (e.clientX / window.innerWidth - 0.5) * 0.5;
					targetY = (e.clientY / window.innerHeight - 0.5) * 0.35;
				};
				window.addEventListener('mousemove', onMove);

				// 主题联动
				const applyTheme = () => {
					themeSuccess.set(readColor('--color-success'));
					themeAccent.set(readColor('--color-accent'));
					themeInk.set(readColor('--color-ink-3'));
					for (let i = 0; i < bars.length; i++) {
						const t = topics[i];
						bars[i].mats[0].color.set(
							t.completed ? themeSuccess : t.mastery > 0 ? themeAccent : themeInk
						);
					}
				};
				const mo = new MutationObserver(applyTheme);
				mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

				// 渲染循环：柱子生长（错相位）+ 旋转 + 视差
				let raf = 0;
				let startTime = performance.now();
				const tick = () => {
					const elapsed = (performance.now() - startTime) / 1000;
					curX += (targetX - curX) * 0.05;
					curY += (targetY - curY) * 0.05;
					group.rotation.x = curY * 0.25;
					group.rotation.y = curX * 0.4 + performance.now() * 0.00012;
					for (const b of bars) {
						const t = Math.min(1, Math.max(0, (elapsed - b.delay) / 0.7));
						const eased = 1 - Math.pow(1 - t, 3);
						b.cur = b.target * eased;
						b.mesh.scale.y = Math.max(0.001, b.cur);
						b.mesh.position.y = b.cur / 2;
					}
					renderer.render(scene, camera);
					raf = requestAnimationFrame(tick);
				};
				if (reduced) {
					// 减弱动效：直接显示最终高度
					for (const b of bars) {
						b.mesh.scale.y = b.target;
						b.mesh.position.y = b.target / 2;
					}
					renderer.render(scene, camera);
				} else {
					tick();
				}

				cleanup = () => {
					cancelAnimationFrame(raf);
					ro.disconnect();
					mo.disconnect();
					window.removeEventListener('mousemove', onMove);
					barGeo.dispose();
					bars.forEach((b) => b.mats.forEach((m) => m.dispose()));
					renderer.dispose();
					canvas.remove();
				};
			} catch {
				// 静默降级（中心数字 HTML 仍在）
			}
		})();

		return () => cleanup();
	});
</script>

<div class="mastery3d" bind:this={containerEl} aria-hidden="true"></div>
<div class="mastery-center">
	<span class="mastery-big">{avg}%</span>
	<span class="mastery-label">平均掌握度</span>
</div>

<style>
	.mastery3d {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.mastery3d :global(canvas) {
		display: block;
	}

	.mastery-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		gap: 4px;
	}

	.mastery-big {
		font-family: var(--font-display);
		font-size: 52px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--color-ink);
	}

	.mastery-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.2em;
		color: var(--color-ink-3);
	}
</style>

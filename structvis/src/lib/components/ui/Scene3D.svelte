<script lang="ts">
	import { onMount } from 'svelte';
	import type { WebGLRenderer, Scene as ThreeScene } from 'three';

	/** three.js 全站 3D 背景：粒子场，随鼠标视差缓慢旋转，固定于视口。
	 *  - 懒加载：仅当组件挂载才动态 import three（约 150KB，由根布局全局挂载）
	 *  - 降级：WebGL 不可用 / 系统减弱动效 → 静默不渲染（页面功能不受影响）
	 *  - 主题联动：切换亮/暗主题时粒子颜色跟随 token
	 */
	let containerEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (typeof window === 'undefined') return;
		// 测试/无头环境可注入禁用标志（e2e 注入 window.__DSH_NO_SCENE__ 避免软件渲染拖慢）
		if ((window as unknown as Record<string, unknown>).__DSH_NO_SCENE__) return;
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
					return; // WebGL 不可用 → 静默降级
				}

				const scene: ThreeScene = new THREE.Scene();
				const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
				camera.position.z = 18;

				const readColor = (name: string): number => {
					const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
					return v ? parseInt(v.replace('#', ''), 16) : 0x1a1a1a;
				};

				// === 粒子场（墨色主体 + 琥珀点缀，覆盖整页视口） ===
				const COUNT = 1400;
				const positions = new Float32Array(COUNT * 3);
				const colors = new Float32Array(COUNT * 3);
				for (let i = 0; i < COUNT; i++) {
					positions[i * 3] = (Math.random() - 0.5) * 46;
					positions[i * 3 + 1] = (Math.random() - 0.5) * 34;
					positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
				}
				const paintColors = () => {
					const baseC = new THREE.Color(readColor('--color-ink'));
					const accentC = new THREE.Color(readColor('--color-accent'));
					for (let i = 0; i < COUNT; i++) {
						const c = Math.random() < 0.12 ? accentC : baseC;
						colors[i * 3] = c.r;
						colors[i * 3 + 1] = c.g;
						colors[i * 3 + 2] = c.b;
					}
				};
				paintColors();

				const geo = new THREE.BufferGeometry();
				geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
				geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
				const pointsMat = new THREE.PointsMaterial({
					size: 0.06,
					vertexColors: true,
					transparent: true,
					opacity: 0.85,
					depthWrite: false
				});
				const points = new THREE.Points(geo, pointsMat);
				scene.add(points);

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

				// === 鼠标视差 ===
				let targetX = 0;
				let targetY = 0;
				let curX = 0;
				let curY = 0;
				const onMove = (e: MouseEvent) => {
					targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
					targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
				};
				window.addEventListener('mousemove', onMove);

				// === 主题联动 ===
				const applyTheme = () => {
					paintColors();
					geo.attributes.color.needsUpdate = true;
				};
				const mo = new MutationObserver(applyTheme);
				mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

				// === 渲染循环 ===
				let raf = 0;
				const tick = () => {
					curX += (targetX - curX) * 0.05;
					curY += (targetY - curY) * 0.05;
					scene.rotation.x = curY * 0.4;
					scene.rotation.y = curX * 0.6 + performance.now() * 0.00003;
					points.rotation.y += 0.00006;
					renderer.render(scene, camera);
					raf = requestAnimationFrame(tick);
				};
				if (reduced) {
					renderer.render(scene, camera);
				} else {
					tick();
				}

				cleanup = () => {
					cancelAnimationFrame(raf);
					ro.disconnect();
					mo.disconnect();
					window.removeEventListener('mousemove', onMove);
					geo.dispose();
					pointsMat.dispose();
					renderer.dispose();
					canvas.remove();
				};
			} catch {
				// 任何异常静默降级（页面内容不受影响）
			}
		})();

		return () => cleanup();
	});
</script>

<div class="scene3d" bind:this={containerEl} aria-hidden="true"></div>

<style>
	.scene3d {
		position: fixed;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: -1; /* 沉到内容之下：粒子成为玻璃卡片的模糊底景 */
	}

	.scene3d :global(canvas) {
		display: block;
	}
</style>

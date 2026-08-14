<script lang="ts">
	import { onMount } from 'svelte';
	import type { WebGLRenderer, Scene as ThreeScene, Object3D, MeshBasicMaterial } from 'three';

	/** three.js 全站 3D 背景：粒子场 + 线框几何体，随鼠标视差缓慢旋转，固定于视口。
	 *  - 懒加载：仅当组件挂载才动态 import three（约 150KB，由根布局全局挂载）
	 *  - 降级：WebGL 不可用 / 系统减弱动效 → 静默不渲染（页面功能不受影响）
	 *  - 主题联动：切换亮/暗主题时粒子与线框颜色跟随 token
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

				// === 主题漂浮体：数据库圆柱 / 排序柱 / 链表节点链（呼应「数据结构与数据库」） ===
				let themeAcademic = new THREE.Color(readColor('--color-academic'));
				let themeAccent = new THREE.Color(readColor('--color-accent'));
				const floaters: {
					mesh: Object3D;
					rx: number;
					ry: number;
					phase: number;
					baseY: number;
					mats: MeshBasicMaterial[];
				}[] = [];
				const shapeDefs: { kind: string; size: number; extra?: number; accent?: boolean }[] = [
					{ kind: 'cylinder', size: 0.55, extra: 0.95 }, // 数据库表（圆柱）
					{ kind: 'bar', size: 0.42, extra: 0.9 }, // 排序柱（数组元素）
					{ kind: 'bar', size: 0.42, extra: 1.35 },
					{ kind: 'bar', size: 0.42, extra: 0.6, accent: true },
					{ kind: 'chain', size: 0.26 } // 链表节点链（两节点 + 连线）
				];
				for (let i = 0; i < shapeDefs.length; i++) {
					const d = shapeDefs[i];
					const mat = new THREE.MeshBasicMaterial({
						color: d.accent ? themeAccent : themeAcademic,
						transparent: true,
						opacity: d.accent ? 0.4 : 0.45
					});
					let m: Object3D;
					const mats: MeshBasicMaterial[] = [mat];
					if (d.kind === 'cylinder') {
						m = new THREE.Mesh(new THREE.CylinderGeometry(d.size, d.size, d.extra ?? 0.9, 20), mat);
						m.rotation.z = Math.PI / 2; // 横放，像数据记录
					} else if (d.kind === 'bar') {
						m = new THREE.Mesh(new THREE.BoxGeometry(d.size, d.extra ?? 0.9, d.size), mat);
					} else {
						// 链表节点链：两球 + 连线
						const g = new THREE.Group();
						const nodeGeo = new THREE.SphereGeometry(d.size, 14, 10);
						const n1 = new THREE.Mesh(nodeGeo, mat);
						n1.position.x = -0.55;
						const n2 = new THREE.Mesh(nodeGeo, mat);
						n2.position.x = 0.55;
						const linkMat = new THREE.MeshBasicMaterial({
							color: themeAcademic,
							transparent: true,
							opacity: 0.35
						});
						const link = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.07, 0.07), linkMat);
						g.add(n1, n2, link);
						mats.push(linkMat);
						m = g;
					}
					m.position.set(
						(Math.random() - 0.5) * 30,
						(Math.random() - 0.5) * 20,
						-6 + Math.random() * 5
					);
					scene.add(m);
					floaters.push({
						mesh: m,
						rx: (Math.random() - 0.5) * 0.5,
						ry: (Math.random() - 0.5) * 0.5,
						phase: Math.random() * Math.PI * 2,
						baseY: m.position.y,
						mats
					});
				}

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
					themeAcademic.set(readColor('--color-academic'));
					themeAccent.set(readColor('--color-accent'));
					for (let i = 0; i < floaters.length; i++) {
						const isAccent = shapeDefs[i].accent ?? false;
						floaters[i].mats.forEach((mat, mi) => {
							mat.color.set(mi === 0 ? (isAccent ? themeAccent : themeAcademic) : themeAcademic);
						});
					}
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
					const ft = performance.now() * 0.001;
					for (const f of floaters) {
						f.mesh.rotation.x += f.rx * 0.01;
						f.mesh.rotation.y += f.ry * 0.01;
						f.mesh.position.y = f.baseY + Math.sin(ft * 0.6 + f.phase) * 0.35;
					}
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
					floaters.forEach((f) => {
						f.mats.forEach((mat) => mat.dispose());
						if (f.mesh instanceof THREE.Mesh) {
							f.mesh.geometry.dispose();
						} else {
							f.mesh.traverse((o) => {
								if (o instanceof THREE.Mesh) o.geometry.dispose();
							});
						}
					});
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

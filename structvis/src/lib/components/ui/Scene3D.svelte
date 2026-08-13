<script lang="ts">
	import { onMount } from 'svelte';
	import type { WebGLRenderer, Scene as ThreeScene, BufferGeometry, Mesh } from 'three';

	/** three.js 全页 3D 背景：粒子场 + 线框几何体，随鼠标视差缓慢旋转，固定于视口。
	 *  - 懒加载：仅当组件挂载才动态 import three（约 150KB，只出现在首页）
	 *  - 降级：WebGL 不可用 / 系统减弱动效 → 静默不渲染（页面功能不受影响）
	 *  - 主题联动：切换亮/暗主题时粒子与线框颜色跟随 token
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

				// === 线框几何体（学术蓝，呼应数据结构抽象） ===
				const wireMat = new THREE.MeshBasicMaterial({
					color: readColor('--color-academic'),
					wireframe: true,
					transparent: true,
					opacity: 0.16
				});
				const shapes: { mesh: Mesh; rx: number; ry: number }[] = [];
				const defs = [
					{ kind: 'icosahedron', radius: 2.6, pos: [-6.2, 1.5, -2], rx: 0.12, ry: 0.2 },
					{ kind: 'torus', radius: 2.2, tube: 0.7, pos: [6.6, -1.7, -3], rx: 0.2, ry: 0.1 },
					{ kind: 'octahedron', radius: 1.8, pos: [5.4, 2.5, -1], rx: -0.18, ry: 0.12 },
					{ kind: 'box', size: 2.2, pos: [-5.6, -2.3, -2.5], rx: 0.1, ry: -0.16 }
				];
				for (const d of defs) {
					let g: BufferGeometry;
					if (d.kind === 'icosahedron') g = new THREE.IcosahedronGeometry(d.radius, 1);
					else if (d.kind === 'torus') g = new THREE.TorusGeometry(d.radius, d.tube, 12, 24);
					else if (d.kind === 'octahedron') g = new THREE.OctahedronGeometry(d.radius, 0);
					else g = new THREE.BoxGeometry(d.size, d.size, d.size);
					const m = new THREE.Mesh(g, wireMat);
					m.position.set(d.pos[0], d.pos[1], d.pos[2]);
					scene.add(m);
					shapes.push({ mesh: m, rx: d.rx, ry: d.ry });
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
					wireMat.color.set(readColor('--color-academic'));
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
					for (const s of shapes) {
						s.mesh.rotation.x += s.rx * 0.01;
						s.mesh.rotation.y += s.ry * 0.01;
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
					wireMat.dispose();
					shapes.forEach((s) => s.mesh.geometry.dispose());
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
		z-index: 0;
	}

	.scene3d :global(canvas) {
		display: block;
	}
</style>

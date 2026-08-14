<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		WebGLRenderer,
		Scene as ThreeScene,
		Object3D,
		Mesh,
		MeshBasicMaterial
	} from 'three';

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

	/** three.js 掌握度总览 v2（炫彩版）：
	 *  - 34 根掌握度柱绕环排列，生长动画 + 柱顶发光光点
	 *  - 底座能量光环（additive 呼吸旋转）+ 环绕粒子星环
	 *  - 整体缓慢旋转 + 鼠标视差 + 主题联动 + 懒加载降级
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

				let themeSuccess = new THREE.Color(readColor('--color-success'));
				let themeAccent = new THREE.Color(readColor('--color-accent'));
				let themeInk = new THREE.Color(readColor('--color-ink-3'));

				// === 掌握度柱阵（环形） + 柱顶光点 ===
				const COUNT = Math.max(1, topics.length);
				const RADIUS = 4.6;
				const bars: {
					mesh: Object3D;
					top: Mesh;
					target: number;
					cur: number;
					delay: number;
					mats: MeshBasicMaterial[];
				}[] = [];
				const group = new THREE.Group();
				const barGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
				const dotGeo = new THREE.SphereGeometry(0.085, 10, 8);
				for (let i = 0; i < COUNT; i++) {
					const t = topics[i];
					const h = 0.12 + (t.mastery / 100) * 2.7;
					const barColor = t.completed ? themeSuccess : t.mastery > 0 ? themeAccent : themeInk;
					const mat = new THREE.MeshBasicMaterial({
						color: barColor,
						transparent: true,
						opacity: t.mastery > 0 ? 0.92 : 0.5
					});
					// 柱顶光点（additive 发光）
					const dotMat = new THREE.MeshBasicMaterial({
						color: barColor,
						transparent: true,
						opacity: 0.95,
						blending: THREE.AdditiveBlending,
						depthWrite: false
					});
					const dot = new THREE.Mesh(dotGeo, dotMat);
					const angle = (i / COUNT) * Math.PI * 2;
					const m = new THREE.Mesh(barGeo, mat);
					m.position.set(Math.cos(angle) * RADIUS, h / 2, Math.sin(angle) * RADIUS);
					m.scale.y = 0.001;
					dot.position.copy(m.position);
					dot.position.y = h + 0.05;
					group.add(m);
					group.add(dot);
					bars.push({
						mesh: m,
						top: dot,
						target: h,
						cur: 0,
						delay: i * 0.018,
						mats: [mat, dotMat]
					});
				}
				scene.add(group);

				// === 底座能量光环（additive，呼吸 + 旋转） ===
				const ringMat = new THREE.MeshBasicMaterial({
					color: themeAccent,
					transparent: true,
					opacity: 0.5,
					blending: THREE.AdditiveBlending,
					depthWrite: false,
					side: THREE.DoubleSide
				});
				const ring = new THREE.Mesh(new THREE.TorusGeometry(RADIUS + 0.15, 0.018, 8, 90), ringMat);
				ring.rotation.x = Math.PI / 2;
				ring.position.y = 0.02;
				scene.add(ring);

				// === 环绕粒子星环（additive 光点） ===
				const STAR_COUNT = 420;
				const starPos = new Float32Array(STAR_COUNT * 3);
				for (let i = 0; i < STAR_COUNT; i++) {
					const r = RADIUS + 0.6 + Math.random() * 2.2;
					const a = Math.random() * Math.PI * 2;
					starPos[i * 3] = Math.cos(a) * r;
					starPos[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
					starPos[i * 3 + 2] = Math.sin(a) * r;
				}
				const starGeo = new THREE.BufferGeometry();
				starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
				const starMat = new THREE.PointsMaterial({
					color: themeAccent,
					size: 0.055,
					transparent: true,
					opacity: 0.8,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				});
				const stars = new THREE.Points(starGeo, starMat);
				scene.add(stars);

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
						const c = t.completed ? themeSuccess : t.mastery > 0 ? themeAccent : themeInk;
						bars[i].mats.forEach((m) => m.color.set(c));
					}
					ringMat.color.set(themeAccent);
					starMat.color.set(themeAccent);
				};
				const mo = new MutationObserver(applyTheme);
				mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

				// 渲染循环：生长 + 环呼吸旋转 + 星环浮动 + 视差
				let raf = 0;
				const startTime = performance.now();
				const tick = () => {
					const elapsed = (performance.now() - startTime) / 1000;
					curX += (targetX - curX) * 0.05;
					curY += (targetY - curY) * 0.05;
					group.rotation.x = curY * 0.25;
					group.rotation.y = curX * 0.4 + performance.now() * 0.00012;

					// 能量环：呼吸 + 缓转
					ring.rotation.z = performance.now() * 0.0002;
					ringMat.opacity = 0.32 + 0.18 * Math.sin(elapsed * 1.2);

					// 星环：缓慢旋转 + 轻微浮动
					stars.rotation.y = performance.now() * 0.00015;
					stars.position.y = Math.sin(elapsed * 0.5) * 0.15;

					// 柱子生长（错相位）+ 光点跟随
					for (const b of bars) {
						const t = Math.min(1, Math.max(0, (elapsed - b.delay) / 0.7));
						const eased = 1 - Math.pow(1 - t, 3);
						b.cur = b.target * eased;
						b.mesh.scale.y = Math.max(0.001, b.cur);
						b.mesh.position.y = b.cur / 2;
						b.top.position.y = b.cur + 0.05;
						// 光点随生长脉冲
						b.mats[1].opacity = 0.5 + 0.45 * Math.min(1, eased * 2);
					}
					renderer.render(scene, camera);
					raf = requestAnimationFrame(tick);
				};
				if (reduced) {
					for (const b of bars) {
						b.mesh.scale.y = b.target;
						b.mesh.position.y = b.target / 2;
						b.top.position.y = b.target + 0.05;
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
					dotGeo.dispose();
					ringMat.dispose();
					starGeo.dispose();
					starMat.dispose();
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

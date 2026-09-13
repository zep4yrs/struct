// App 构建变体入口：MOBILE_APP=1 → base='' + 产物到 build-app/（Capacitor webDir）
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['vite', 'build'], {
	stdio: 'inherit',
	shell: true,
	env: { ...process.env, MOBILE_APP: '1' }
});
process.exit(r.status ?? 1);

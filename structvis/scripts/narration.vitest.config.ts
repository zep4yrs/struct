/**
 * 旁白音频生成脚本的独立 vitest 配置。
 * 用法：npx vitest run --config scripts/narration.vitest.config.ts
 * 不进入默认测试项目（默认 include 仅 src/**），CI 的 npm test 不会执行它。
 */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			// 剧本 spec 链路里的 $app/paths 在纯 node 生成环境用桩替代
			'$app/paths': path.resolve(import.meta.dirname, 'stub-app-paths.ts')
		}
	},
	test: {
		include: ['scripts/**/*.spec.ts'],
		environment: 'node',
		// 生成脚本不做断言计数，放宽 requireAssertions（默认 config 才有该限制）
		expect: { requireAssertions: false },
		testTimeout: 120000,
		hookTimeout: 120000
	}
});

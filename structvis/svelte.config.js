import adapter from '@sveltejs/adapter-static';

// MOBILE_APP=1：App（Capacitor）构建变体——base 归零 + 产物落 build-app/（进 android WebView）
const MOBILE = !!process.env.MOBILE_APP;
const OUT = MOBILE ? 'build-app' : '../docs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({ pages: OUT, assets: OUT }),
		paths: {
			base: MOBILE ? '' : '/struct',
			relative: true
		}
	}
};

export default config;

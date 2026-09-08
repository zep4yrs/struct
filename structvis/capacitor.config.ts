import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'top.fengqiao.structvis',
	appName: 'StructVis',
	webDir: 'build-app',
	android: {
		allowMixedContent: false
	}
};

export default config;

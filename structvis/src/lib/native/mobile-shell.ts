/**
 * App 原生体验层（Capacitor WebView 宿主专用）。
 * 只经 window.Capacitor 全局桥访问插件——不 import @capacitor/*，
 * 纯 Web 构建（master）与本分支均零打包差异；非原生环境全部静默跳过。
 */

interface CapPlugins {
	App?: {
		addListener: (
			ev: 'backButton',
			cb: (e: { canGoBack: boolean }) => void
		) => { remove: () => void };
		exitApp: () => void;
	};
	StatusBar?: {
		setStyle: (o: { style: 'Dark' | 'Light' }) => Promise<void>;
		setBackgroundColor: (o: { color: string }) => Promise<void>;
	};
	SplashScreen?: { hide: (o: { fadeOutDuration: number }) => Promise<void> };
}

function plugins(): CapPlugins | null {
	const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: CapPlugins } })
		.Capacitor;
	if (!cap?.isNativePlatform?.()) return null;
	return cap.Plugins ?? null;
}

const PAPER = { light: '#faf9f6', dark: '#161514' } as const;

/** 状态栏随主题：暗色 Dark 样式 + 纸色底（e2e 主题切换同源） */
export async function applyStatusBar(theme: 'light' | 'dark'): Promise<void> {
	const p = plugins();
	if (!p?.StatusBar) return;
	try {
		await p.StatusBar.setStyle({ style: theme === 'dark' ? 'Dark' : 'Light' });
		await p.StatusBar.setBackgroundColor({ color: PAPER[theme] });
	} catch {
		/* 个别 ROM 不支持 setBackgroundColor */
	}
}

/** 启动完成：淡出启动屏 + 返回键 = 历史 back，栈底退出 */
export async function initNativeShell(theme: 'light' | 'dark'): Promise<void> {
	const p = plugins();
	if (!p) return;
	if (p.App) {
		await p.App.addListener('backButton', ({ canGoBack }) => {
			if (canGoBack) window.history.back();
			else p.App!.exitApp();
		});
	}
	await applyStatusBar(theme);
	await p.SplashScreen?.hide({ fadeOutDuration: 240 }).catch(() => {});
}

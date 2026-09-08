# StructVis Android（feat/mobile-app 分支）

## 架构决策（2026-09-08 定稿）

- **移动端 = Capacitor 8 WebView 壳**；桌面端（feat/desktop-tauri 分支）= Tauri 2 Rust 壳。
  - 选型依据：本仓库 Web 产物是纯静态 SvelteKit（adapter-static），无需原生渲染层；
    Capacitor 只需 Android SDK（JDK21 即可），Tauri Android 需要额外 Rust + NDK 工具链；
    双端各自取最优壳，共享同一套 `src/` 源码与两套构建变体。
- 数据零后端：localStorage 全量本地（与 Web 同源同键）；后端同步（2c2g 信箱方案）待桌面版后另立项。

## 构建变体

| 变体 | 命令 | base | 产物 |
|---|---|---|---|
| Web（GitHub Pages） | `npm run build` | `/struct` | `../docs` |
| App（Capacitor） | `npm run build:app` | `''` | `build-app/` |

- `MOBILE_APP=1` 由 `scripts/build-app.mjs` 注入，`svelte.config.js` 据此切 base 与产物目录。
- `src/app.html` 的 og-image 已 `%sveltekit.assets%` 化（原硬编码 `/struct` 会打穿 App 变体）。

## 出 APK

```bash
npm run build:app        # Web 变体构建
npx cap sync android     # 同步进 android 工程
cd android && ./gradlew assembleDebug   # 产物 app/build/outputs/apk/debug/app-debug.apk
```

- 需要 `android/local.properties`（本机）：`sdk.dir=<Android SDK 路径>`（正斜杠写法，勿用 `\f` 等转义歧义）。
- 需要 JDK 21（`JAVA_HOME` 指向；系统 Java 25 过新，AGP/Gradle 8.14 不保证）。
- **Windows 中文路径会炸 AGP**（`文件名、目录名或卷标语法不正确`，overridePathCheck 只是消音）——
  本仓库路径含中文，构建请走 ASCII worktree：
  `git worktree add --detach D:/fengqiao/dev/sw feat/mobile-app`（详见仓库根 memory）。
- CI：`.github/workflows/android.yml` 在 push 时自动出 debug APK artifact（ubuntu runner）。

## 原生体验层

`src/lib/native/mobile-shell.ts`（AppLayout onMount 接线）：

- 返回键 = WebView 历史 back，栈底退出；
- 状态栏随站点主题（亮/暗切换同源，纸色底）；
- 启动屏纸白色淡出；
- 全部经 `window.Capacitor` 全局桥——**不 import @capacitor/\***，Web 构建零差异零风险。

## 已知边界

- 图标已品牌化（favicon.svg 栅格化 mipmap 全密度 + 墨底自适应前景层）；
- 模拟器/真机联调：`adb install app-debug.apk` 即可（SDK platform-tools 就绪）；
- `docs/sqljs/sql-wasm.js` 等构建产物是 Mimosa L3 误报源（wasm/emscripten 的 `exec`/`fetch` 特征），
  已归档说明，勿据此改动 vendor 文件。

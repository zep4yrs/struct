# StructVis 桌面端（Tauri 2）— feat/desktop-tauri 分支

## 架构

桌面壳 = Tauri 2（Rust + WebView2），加载与 APK **共用**的 shell 产物 `build-app/`
（SvelteKit MOBILE_APP=1 变体：base=''、绝对资源路径）。

- `src-tauri/tauri.conf.json`：`build.frontendDist = "../build-app"`；窗口 1280×800（min 375×667）；bundle 目标 msi + nsis。
- 站点本体零改动：桌面只是另一个"壳"，`src/` 源码与 master 完全一致。

## 出包

```bash
npm run build:app        # SvelteKit 静态产物 → build-app/
npx cap sync 2>/dev/null # （APK 分支才需要）
npm run tauri:build      # = build:app + tauri build（debug 去掉即 release）
```

产物：`src-tauri/target/release/structvis.exe` + `src-tauri/target/release/bundle/{msi,nsis}/`。

## 本机构建前置（Windows）

- Rust 1.97+（x86_64-pc-windows-msvc target）
- VS 2022 Build Tools 含 VC.Tools.x86.x64（vswhere 可查）
- WebView2 Runtime（Win11 预装）

## 已知边界

- 深链接/刷新回落首页：Capacitor/Tauri 静态壳同一形态边界（SPA 内导航完整）；
  如需拦截 F5，可在 Rust 端 `WebviewWindow` 导航事件重写（v1 未做）。
- `docs/` 是 Web（GitHub Pages）产物，桌面不再依赖（frontendDist 已切 build-app）。

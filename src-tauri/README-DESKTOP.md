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

- 深链接/刷新：**已验证支持，无需修复**（此前"回落首页"的记录不成立）。
  依据：Tauri 2 资源协议的资产解析链（tauri 2.11.5 `src/manager/mod.rs` 的
  `get_asset()`）按 `精确路径 → {path}.html → {path}/index.html → 根 index.html`
  逐级回退——预渲染目录树（每路由一个含 `index.html` 的目录）的子路径 URL
  天然命中第三级；仅访问**完全不存在的**路径才会回落首页。
  验证方法与证据：
  1) 读 `tauri.conf.json`（frontendDist=build-app）与上述 crate 源码确认解析链；
  2) 运行 `target/debug/structvis.exe`（内嵌当前 build-app 资产），窗口恢复到
     `/settings` 子路径后按 F5，页面重载仍为设置页、未回落首页（截图留档）；
  3) 扫描 build-app：除 `ads/`、`audio/` 资源目录外，全部路由目录（根、about、
     catalog、db/* 29 个、ds/* 50 个、home 等）均含 `index.html`，回退链对所有
     内部路由可达；`service-worker.js` 的 navigate 分支为 network-first（fetch
     经 Tauri 协议正确解析），其缓存回退目标为过时的 `/struct/` 路径，不会造成回落。
  如需对不存在路径的自定义 404 行为，可在 Rust 端导航事件重写（未做，无需求）。
- `docs/` 是 Web（GitHub Pages）产物，桌面不再依赖（frontendDist 已切 build-app）。

# StructVis 桌面端（Tauri v2）

加载仓库根 `docs/`（SvelteKit adapter-static 构建产物）的桌面壳。

## 环境要求

- Rust 1.77+（本地已确认 1.97 ✓）
- Windows：MSVC toolchain + WebView2（Win10/11 自带）
- 前置：仓库根先 `cd structvis && npm run build` 产出 `docs/`

## 开发 / 构建

```bash
# 无 cargo-tauri CLI 时先安装：
cargo install tauri-cli --version ^2

cargo tauri dev      # 开发窗口（加载 docs/）
cargo tauri build    # 产出 msi/nsis 安装包（src-tauri/target/release/bundle/）
```

## 说明

- `frontendDist: "../docs"`：与 GitHub Pages 共用同一构建产物，桌面端功能 = 线上功能
- `lib.rs` 已带 `#[cfg_attr(mobile, tauri::mobile_entry_point)]`，`feat/mobile-app` 分支复用同一壳
- 数据同步（服务器信箱方案）在两条分支共享同一前端同步模块

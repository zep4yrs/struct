# StructVis App（Tauri v2 Mobile · Android/iOS）

与 `feat/desktop-tauri` 共用同一 Tauri v2 壳（lib.rs 已带 mobile entry point），
`frontendDist` 同样加载 `docs/` 构建产物。

## 环境要求（移动端额外）

- Android：Android Studio + NDK + SDK（tauri android init 需要）
- iOS：macOS + Xcode（Windows 机器无法构建 iOS，只能开发 Android 侧）

## 脚手架初始化（首次）

```bash
cargo tauri android init   # 生成 gen/android
cargo tauri ios init       # 生成 gen/ios（需 macOS）
cargo tauri android dev    # 真机/模拟器开发
cargo tauri android build  # 产出 APK/AAB
```

## 与桌面的差异（本分支的开发重点）

- 安全区适配：页面已用 env(safe-area-inset-bottom)，底导避让复用
- 触控：拖拽滑切已做轴线锁定；44px 热区已达标
- 数据：本地存储沿用（同步模块与桌面共享，见 ROADMAP 服务器信箱方案）

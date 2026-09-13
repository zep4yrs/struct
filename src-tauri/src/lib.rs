// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .on_page_load(|_webview, payload| {
            // 静态壳无服务端 fallback：记录子路径导航便于诊断
            // （Tauri 资源协议对目录解析 index.html；异常导航在此可见）
            if payload.event() == tauri::webview::PageLoadEvent::Finished {
                let url = payload.url().to_string();
                if url.contains("/db/") {
                    println!("[nav] {url}");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

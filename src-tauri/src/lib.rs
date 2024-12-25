// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod process;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_auth,
            commands::check_auth,
            commands::get_todo,
            commands::get_todo_dtail,
            commands::download_assignment_file,
            commands::get_course_schedule,
            commands::get_notifications,
            commands::get_courses,
            commands::get_course_detail,
            commands::get_course_files,
            commands::download_course_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

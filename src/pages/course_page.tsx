import { invoke } from '@tauri-apps/api/core';
import { useAuth } from "../AuthContext";
import { useEffect, useState } from 'react';

export default function CoursePage() {
    const { authInfo } = useAuth();
    const [htmlContent, setHtmlContent] = useState<string>('');

    useEffect(() => {
        const fetchSchedule = async () => {
            // 先尝试从缓存加载数据
            const cachedData = localStorage.getItem('course_schedule');
            const cachedTime = localStorage.getItem('course_schedule_time');
            
            if (cachedData && cachedTime) {
                const timeDiff = Date.now() - parseInt(cachedTime);
                // 如果缓存时间小于1小时，使用缓存数据
                if (timeDiff < 60 * 60 * 1000) {
                    setHtmlContent(cachedData);
                    return;
                }
            }

            try {
                const result = await invoke("get_course_schedule", { 
                    account: authInfo[4], 
                    password: authInfo[6] 
                }) as string;
                
                setHtmlContent(result);
                // 更新缓存
                localStorage.setItem('course_schedule', result);
                localStorage.setItem('course_schedule_time', Date.now().toString());
            } catch (error) {
                console.error("获取课程表失败:", error);
            }
        };

        fetchSchedule();
    }, [authInfo]);

    return (
        <div className="w-full h-full overflow-auto">
            <div 
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                className="course-schedule-container"
            />
        </div>
    );
}
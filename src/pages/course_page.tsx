import { invoke } from '@tauri-apps/api/core';
import { useAuth } from "../AuthContext";
import { useEffect, useState } from 'react';

export default function CoursePage() {
    const { authInfo } = useAuth();
    const [htmlContent, setHtmlContent] = useState<string>('');

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const result = await invoke("get_course_schedule", { 
                    account: authInfo[4], 
                    password: authInfo[6] 
                }) as string;
                
                setHtmlContent(result);
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
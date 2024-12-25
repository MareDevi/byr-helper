import { invoke } from '@tauri-apps/api/core';
import { useAuth } from "../AuthContext";
import { list_builder } from '../components/list';
import { useEffect, useState } from 'react';

export default function NotificationPage() {
    const [notificationList, setNotificationList] = useState<string[]>([]);
    const { authInfo } = useAuth();

    useEffect(() => {
        // 先尝试从缓存加载数据
        const cachedData = localStorage.getItem('notifications');
        const cachedTime = localStorage.getItem('notifications_time');
        
        if (cachedData && cachedTime) {
            const timeDiff = Date.now() - parseInt(cachedTime);
            // 如果缓存时间小于5分钟，使用缓存数据
            if (timeDiff < 5 * 60 * 1000) {
                setNotificationList(JSON.parse(cachedData));
            }
        }
        
        // 无论是否有缓存，都在后台更新数据
        notifications();
    }, []);

    const notifications = async () => {
        try {
            const result = await invoke<string[]>("get_notifications", {
                blade: authInfo[0],
                tenantId: authInfo[1],
                userId: authInfo[2],
                authToken: authInfo[3],
            });
            setNotificationList(result);
            // 更新缓存
            localStorage.setItem('notifications', JSON.stringify(result));
            localStorage.setItem('notifications_time', Date.now().toString());
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-neutral-200">通知</h1>
                {list_builder(notificationList)}
            </div>
        </div>
    );
}
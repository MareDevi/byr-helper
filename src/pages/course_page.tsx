import { invoke } from '@tauri-apps/api/core';
import { useAuth } from "../AuthContext";
import { useEffect, useState } from 'react';
import CardBuilder from '../components/card';
import CourseDetailPage from './course_detail_page';

export default function CoursePage() {
    const { authInfo } = useAuth();
    const [courseList, setCourseList] = useState<string[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        // 先尝试从缓存加载数据
        const cachedData = localStorage.getItem('courses');
        const cachedTime = localStorage.getItem('courses_time');
        
        if (cachedData && cachedTime) {
            const timeDiff = Date.now() - parseInt(cachedTime);
            // 如果缓存时间小于5分钟，使用缓存数据
            if (timeDiff < 5 * 60 * 1000) {
                setCourseList(JSON.parse(cachedData));
            }
        }
        
        // 无论是否有缓存，都在后台更新数据
        courses();
    }, []);

    const courses = async () => {
        try {
            const result = await invoke<string[]>("get_courses", {
                blade: authInfo[0],
                tenantId: authInfo[1],
                userId: authInfo[2],
                authToken: authInfo[3],
            });
            setCourseList(result);
            // 更新缓存
            localStorage.setItem('courses', JSON.stringify(result));
            localStorage.setItem('courses_time', Date.now().toString());
        } catch (error) {
            console.error(error);
        }
    }

    const handleCardClick = (id: string) => {
        setSelectedCourse(id);
        setShowDetail(true);
    };

    const handleBack = () => {
        setShowDetail(false);
        setSelectedCourse(null);
    };

    return (
        <div>
            {!showDetail ? (
                <div className="p-4">
                    <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-neutral-200">课程</h1>
                    <CardBuilder data={courseList} onCardClick={handleCardClick} />
                </div>
            ) : (
                <div>
                    <button 
                        onClick={handleBack}
                        className="mb-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    >
                        返回课程列表
                    </button>
                    {selectedCourse && <CourseDetailPage courseId={selectedCourse} />}
                </div>
            )}
        </div>
    );
}
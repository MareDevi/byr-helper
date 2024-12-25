import { invoke } from '@tauri-apps/api/core';
import { useAuth } from "../AuthContext";
import { useEffect, useState } from 'react';
import { tablebuilder } from "../components/table";
import { save } from '@tauri-apps/plugin-dialog';
import Alert from '../components/alert';

interface Teacher {
    name: string;
}

interface CourseDetail {
    siteName: string;
    courseType: string;
    teachers: Teacher[];
    // ...其他属性
}

interface CourseDetailPageProps {
    courseId: string;
}

interface CourseFile {
    storageId: string;
    name: string;
    ext: string;
    fileSizeUnit: string;
}

export default function CourseDetailPage({ courseId }: CourseDetailPageProps) {
    const { authInfo } = useAuth();
    const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
    const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    useEffect(() => {
        const fetchCourseDetail = async () => {
            try {
                const result = await invoke("get_course_detail", { 
                    blade: authInfo[0], 
                    tenantId: authInfo[1], 
                    courseId: courseId,
                    authToken: authInfo[3],
                }) as string;
                
                const parsedDetail = JSON.parse(result) as CourseDetail;
                setCourseDetail(parsedDetail);
            } catch (error) {
                console.error("获取课程详情失败:", error);
            }

            try {
                const result = await invoke("get_course_files", { 
                    blade: authInfo[0], 
                    tenantId: authInfo[1], 
                    courseId: courseId,
                    userId: authInfo[2],
                    authToken: authInfo[3],
                }) as string[];
                
                // 解析每个JSON字符串
                const parsedFiles = result.map(fileJson => JSON.parse(fileJson) as CourseFile);
                setCourseFiles(parsedFiles);
            } catch (error) {
                console.error("获取课程文件失败:", error);
            }
        };

        fetchCourseDetail();
    }, [authInfo, courseId]);

    const fileColumns = [
        {
            key: 'name',
            title: '文件名',
        },
        {
            key: 'ext',
            title: '文件类型',
        },
        {
            key: 'fileSizeUnit',
            title: '文件大小',
        }
    ];

    const handleDownload = async (file: CourseFile) => {
        const path = await save({
            defaultPath: `${file.name}`,
        });

        if (!path) return;

        try {
            await invoke("download_course_file", {
                fileFormat: file.ext,
                storageId: file.storageId,  // 添加文件ID参数
                path: path
            });

            setAlertState({
                isOpen: true,
                title: '下载成功',
                message: `文件 ${file.name}${file.ext} 已成功下载`,
                type: 'success'
            });
        } catch (error) {
            setAlertState({
                isOpen: true,
                title: '下载失败',
                message: '文件下载过程中发生错误',
                type: 'error'
            });
        }
    };

    return (
        <div className="w-full h-full overflow-auto p-4">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-neutral-200">课程详情</h1>
                    {courseDetail && (
                        <div className="space-y-4">
                            <p className="text-gray-700 dark:text-neutral-300">
                                课程名称: {courseDetail.siteName}
                            </p>
                            <p className="text-gray-700 dark:text-neutral-300">
                                课程类型: {courseDetail.courseType}
                            </p>
                            <div>
                                <p className="text-gray-700 dark:text-neutral-300">授课教师:</p>
                                <ul className="list-disc pl-5">
                                    {courseDetail.teachers.map((teacher, index) => (
                                        <li key={index} className="text-gray-700 dark:text-neutral-300">
                                            {teacher.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-neutral-200">课程文件</h2>
                    <div className="h-[30vh] overflow-auto">
                        {tablebuilder({
                            data: courseFiles,
                            columns: fileColumns,
                            rowKey: 'name',
                            actionText: "下载",
                            onAction: handleDownload
                        })}
                    </div>
                </div>
            </div>
            <Alert 
                {...alertState}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
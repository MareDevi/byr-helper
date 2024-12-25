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
        <div className="w-full h-full overflow-auto p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-neutral-100 border-b pb-4">
                        课程详情
                    </h1>
                    {courseDetail && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-500 dark:text-neutral-400">课程名称</span>
                                    <span className="text-lg text-gray-800 dark:text-neutral-200">{courseDetail.siteName}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-500 dark:text-neutral-400">课程类型</span>
                                    <span className="text-lg text-gray-800 dark:text-neutral-200">{courseDetail.courseType}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm text-gray-500 dark:text-neutral-400">授课教师</span>
                                <div className="flex flex-wrap gap-2">
                                    {courseDetail.teachers.map((teacher, index) => (
                                        <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-neutral-700 rounded-full text-gray-700 dark:text-neutral-300">
                                            {teacher.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-neutral-100 border-b pb-4">
                        课程文件
                    </h2>
                    {courseFiles.length > 0 ? (
                        <div className="overflow-auto rounded-lg border dark:border-neutral-700">
                            {tablebuilder({
                                data: courseFiles,
                                columns: fileColumns,
                                rowKey: 'name',
                                actionText: "下载",
                                onAction: handleDownload
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                            暂无课程文件
                        </div>
                    )}
                </div>
            </div>
            <Alert 
                {...alertState}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
import { useState, useEffect } from 'react';
import { useAuth } from "../AuthContext";
import { invoke } from '@tauri-apps/api/core';
import { tablebuilder } from "../components/table";
import { save } from '@tauri-apps/plugin-dialog';
import Alert from '../components/alert';

interface Todo {
    Id: string;
    Name: string;
    Subject: string;
    EndTime: string;
}

interface TodoDetail {
    title: string;
    content: string;
    deadline: string;
    resources: {
        [key: string]: {
            resource_id: string;
            resource_type: string;
        }
    };
}

export default function HomePage() {
    const { authInfo } = useAuth();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [todoDetail, setTodoDetail] = useState<TodoDetail | null>(null);
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
        const fetchTodos = async () => {
            // 先尝试从缓存加载数据
            const cachedData = localStorage.getItem('todos');
            const cachedTime = localStorage.getItem('todos_time');
            
            if (cachedData && cachedTime) {
                const timeDiff = Date.now() - parseInt(cachedTime);
                // 如果缓存时间小于5分钟，使用缓存数据
                if (timeDiff < 5 * 60 * 1000) {
                    setTodos(JSON.parse(cachedData));
                }
            }

            try {
                const result = await invoke("get_todo", { 
                    blade: authInfo[0], 
                    tenantId: authInfo[1], 
                    userId: authInfo[2], 
                    authToken: authInfo[3], 
                });
                const processedTodos = (result as Todo[]).map(todo => ({
                    ...todo,
                    Name: todo.Name.replace(/\"/g, '').trim(),
                    Subject: todo.Subject.replace(/\"/g, ''),
                    EndTime: todo.EndTime.replace(/\"/g, ''),
                    Id: todo.Id.replace(/\"/g, '')
                }));
                setTodos(processedTodos);
                // 更新缓存
                localStorage.setItem('todos', JSON.stringify(processedTodos));
                localStorage.setItem('todos_time', Date.now().toString());
            } catch (error) {
                console.error("Failed to fetch todos:", error);
            }
        };
        
        fetchTodos();
    }, [authInfo]);

    const fetchTodoDetail = async (assignmentId: string) => {
        try {
            const result = await invoke("get_todo_dtail", { 
                blade: authInfo[0], 
                tenantId: authInfo[1], 
                authToken: authInfo[3], 
                assignmentId: assignmentId
            });
            return result as [string[], { [key: string]: { resource_id: string; resource_type: string; } }];
        }
        catch (error) {
            console.error("Failed to fetch todo detail:", error);
            return null;
        }
    };

    const handleRowClick = async (record: Todo) => {
        const result = await fetchTodoDetail(record.Id);
        if (result) {
            const [details, resources] = result;
            setTodoDetail({
                title: details[0],
                content: details[1],
                deadline: details[2],
                resources: resources
            });
        }
    };

    const handleDownload = async (resource: any) => {
        const path = await save({
            defaultPath: resource.fileName,
        });

        try {
            await invoke("download_assignment_file", {
                blade: authInfo[0], 
                tenantId: authInfo[1], 
                authToken: authInfo[3], 
                path: path,
                resourceId: resource.resourceId
            });

            setAlertState({
                isOpen: true,
                title: '下载成功',
                message: `文件 ${resource.fileName} 已成功下载`,
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

    const columns = [
        {
            key: 'Name',
            title: '作业名称',
        },
        {
            key: 'Subject',
            title: '课程名称',
        },
        {
            key: 'EndTime',
            title: '截止时间',
        }
    ];

    const resourceColumns = [
        {
            key: 'fileName',
            title: '文件名',
        },
        {
            key: 'fileType',
            title: '文件类型',
        }
    ];

    return (
        <div>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-neutral-200">待办清单</h1>
                <div className="h-[30vh] overflow-auto">
                    {tablebuilder({
                        data: todos,
                        columns: columns,
                        rowKey: 'Id',
                        onRowClick: handleRowClick,
                        hideAction: true
                    })}
                </div>
            </div>
            {todoDetail && (
                <div className="container mx-auto p-4">
                    <div className="border rounded-lg overflow-hidden dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-neutral-200 px-6 py-3">
                            {todoDetail.title}
                        </h2>
                        <div 
                            className="prose dark:prose-invert max-w-none mb-4 px-6 py-3"
                            dangerouslySetInnerHTML={{ __html: todoDetail.content }}
                        />
                        <p className="text-gray-700 dark:text-neutral-300 px-6 py-3">
                            截止时间: {todoDetail.deadline}
                        </p>
                        {Object.keys(todoDetail.resources).length > 0 && (
                            <div className="px-6 py-3">
                                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-neutral-200">
                                    附件资源
                                </h3>
                                <div className="overflow-x-auto">
                                    {tablebuilder({
                                        data: Object.entries(todoDetail.resources).map(([fileName, info]) => ({
                                            fileName: fileName,
                                            fileType: info.resource_type,
                                            resourceId: info.resource_id
                                        })),
                                        columns: resourceColumns,
                                        rowKey: 'fileName',
                                        actionText: "下载",
                                        onAction: handleDownload
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <Alert 
                {...alertState}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
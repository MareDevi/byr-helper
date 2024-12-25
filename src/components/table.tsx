interface TableColumn {
    key: string;
    title: string;
}

interface TableProps {
    data: any[];
    columns: TableColumn[];
    rowKey: string;
    onRowClick?: (record: any) => void;
    actionText?: string;  // 添加操作按钮文本
    onAction?: (record: any) => void;  // 添加操作处理函数
    hideAction?: boolean;  // 添加这一行
}

export function tablebuilder({ 
    data, 
    columns, 
    rowKey, 
    onRowClick,
    actionText = "删除",  // 默认值为"删除"
    onAction,
    hideAction = false  // 添加这个参数
}: TableProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="border rounded-lg overflow-hidden dark:border-neutral-700">
                <div className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                    <div className="bg-gray-50 dark:bg-neutral-800">
                        <div className="flex">
                            {columns.map((column) => (
                                <div key={column.key} className="flex-1 px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">
                                    {column.title}
                                </div>
                            ))}
                            {!hideAction && onAction && (
                                <div className="w-24 px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">
                                    操作
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-neutral-700 block overflow-y-auto pb-4" style={{ maxHeight: 'calc(30vh - 48px)' }}>
                        {data && data.map((item: any) => (
                            <div 
                                key={`row-${item[rowKey]}`} 
                                className="flex hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
                                onClick={() => onRowClick && onRowClick(item)}
                            >
                                {columns.map((column) => (
                                    <div key={`${item[rowKey]}-${column.key}`} className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">
                                        {item[column.key]}
                                    </div>
                                ))}
                                {!hideAction && onAction && (
                                    <div className="w-24 px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAction(item);
                                            }}
                                            className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400"
                                        >
                                            {actionText}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
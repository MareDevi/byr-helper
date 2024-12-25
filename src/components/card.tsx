interface CardData {
    siteName: string;
    departmentName: string;
    picUrl: string;
    id: string;
}

interface CardBuilderProps {
    data: string[]; // 改为接收字符串数组
    onCardClick: (id: string) => void;
}

const isValidCardData = (data: any): data is CardData => {
    return typeof data === 'object' &&
        typeof data.siteName === 'string' &&
        typeof data.departmentName === 'string' &&
        typeof data.picUrl === 'string' &&
        typeof data.id === 'string';
};

const CardBuilder: React.FC<CardBuilderProps> = ({ data, onCardClick }) => {
    const parseData = (jsonString: string): CardData | null => {
        try {
            if (typeof jsonString !== 'string') {
                console.error('Invalid input: expected string');
                return null;
            }
            
            // 如果输入已经是对象，直接验证
            const parsed = typeof jsonString === 'object' ? jsonString : JSON.parse(jsonString.trim());
            if (isValidCardData(parsed)) {
                return parsed;
            } else {
                // 尝试适配课程数据格式
                return {
                    siteName: parsed.name || parsed.courseName || '未知课程',
                    departmentName: parsed.teacherName || parsed.department || '未知教师',
                    picUrl: parsed.coverUrl || '/default-course.png', // 确保有默认图片
                    id: parsed.id?.toString() || parsed.courseId?.toString() || 'unknown'
                };
            }
        } catch (e) {
            console.error('Data parse error:', e);
            return null;
        }
    };

    return (
        <div className="grid grid-cols-3 gap-4">
            {data.map((jsonString, index) => {
                const item = parseData(jsonString);
                if (!item) return null;

                return (
                    <div key={item.id || index} className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-neutral-900 dark:border-neutral-700 dark:shadow-neutral-700/70">
                        <div className="w-full h-48">
                            <img 
                                className="w-full h-full rounded-t-xl object-cover" 
                                src={item.picUrl} 
                                alt={item.siteName} 
                            />
                        </div>
                        <div className="p-4 md:p-5">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                {item.siteName}
                            </h3>
                            <p className="mt-1 text-gray-500 dark:text-neutral-400">
                                {item.departmentName}
                            </p>
                            <button
                                onClick={() => onCardClick(item.id)}
                                className="mt-2 py-2 px-3 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                查看
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CardBuilder;
interface AlertProps {
    title?: string;
    message?: string;
    isOpen: boolean;
    onClose: () => void;
    type?: 'success' | 'error' | 'info';
}

const icons = {
    success: <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>,
    error: <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>,
    info: <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
};

export default function Alert({ 
    title = "操作成功", 
    message = "操作已完成",
    isOpen,
    onClose,
    type = 'success'
}: AlertProps) {
    if (!isOpen) return null;

    const iconColors = {
        success: "border-green-50 bg-green-100 text-green-500 dark:bg-green-700 dark:border-green-600 dark:text-green-100",
        error: "border-red-50 bg-red-100 text-red-500 dark:bg-red-700 dark:border-red-600 dark:text-red-100",
        info: "border-blue-50 bg-blue-100 text-blue-500 dark:bg-blue-700 dark:border-blue-600 dark:text-blue-100"
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg max-w-lg w-full m-3">
                <div className="relative p-4 sm:p-10 text-center">
                    <button 
                        onClick={onClose}
                        className="absolute top-2 right-2 size-8 inline-flex justify-center items-center rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                        <span className="sr-only">关闭</span>
                        <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </button>

                    <span className={`mb-4 inline-flex justify-center items-center size-[46px] rounded-full border-4 ${iconColors[type]}`}>
                        <svg className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
                            {icons[type]}
                        </svg>
                    </span>

                    <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-neutral-200">
                        {title}
                    </h3>
                    <p className="text-gray-500 dark:text-neutral-500">
                        {message}
                    </p>

                    <div className="mt-6 flex justify-center">
                        <button 
                            onClick={onClose}
                            className="py-2 px-3 inline-flex items-center text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                        >
                            确定
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
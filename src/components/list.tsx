export function list_builder(items: string[]) {
    return (
        <div className="border rounded-lg overflow-hidden dark:border-neutral-700">
            <ul className="divide-y divide-gray-200 dark:divide-neutral-700">
                {items.map((item, index) => (
                    <li 
                        key={index} 
                        className="px-6 py-4 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-800"
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
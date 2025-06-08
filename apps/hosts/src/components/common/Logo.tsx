export default function Logo() {
    return (
        <div className="flex items-center space-x-3 p-2 rounded-lg">
            {/* Icon */}
            <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold shadow-md">
                S
            </div>

            {/* App Name */}
            <span className="text-2xl font-bold text-base-content">
                Stay<span className="text-primary">inn.</span>
            </span>
        </div>
    );
}

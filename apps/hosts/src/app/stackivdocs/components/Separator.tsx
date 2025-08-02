export function Separator() {
    return (
        <div className="flex items-center w-full">
            <div className="flex-1 h-0.5 rounded-full bg-accent" />
            <span className="mx-4 px-3 py-1 rounded-full bg-accent text-base-100 font-semibold shadow">
                OR
            </span>
            <div className="flex-1 h-0.5 rounded-full bg-accent" />
        </div>
    );
}

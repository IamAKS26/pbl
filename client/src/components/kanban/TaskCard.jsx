import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskCard = ({ task, onClick, onSubmitClick, isStudent = false }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isPending = task.status === 'Under Review' || task.status === 'Pending';
    const isCompleted = task.status === 'Done' || task.status === 'Completed';

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return 'badge-low';
            case 'Medium': return 'badge-medium';
            case 'High': return 'badge-high';
            case 'Urgent': return 'badge-urgent';
            default: return 'badge-medium';
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`glass-card relative group p-4 border border-white/60 hover:border-emerald-300/50 transition-all duration-300
                ${isCompleted ? 'opacity-75 bg-gray-50/50' : 'bg-white/80'}
            `}
        >
            <div className="flex items-start justify-between mb-3">
                <h4 className={`font-display font-semibold text-gray-800 flex-1 leading-tight ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                </h4>
                <div className="flex gap-1 shrink-0 ml-2">
                    {isPending && <span className="px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-[10px] font-bold border border-yellow-100">Review</span>}
                    {isCompleted && <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-bold border border-green-100">Done</span>}
                    {!isPending && !isCompleted && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {task.priority}
                        </span>
                    )}
                </div>
            </div>

            {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Evidence Links (Chips) */}
            {task.evidenceLinks?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {task.evidenceLinks.map((link, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs flex items-center max-w-full truncate">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            Link Submitted
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <div className="flex items-center space-x-3">
                    {/* Icons for comments/commits could go here */}
                </div>

                {/* Submit Action (Only for Student and Active tasks) */}
                {isStudent && !isCompleted && !isPending && (
                    <button
                        onMouseDown={(e) => {
                            e.stopPropagation(); // Prevent drag start
                        }}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            onSubmitClick && onSubmitClick(task);
                        }}
                        className="btn btn-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 z-10"
                    >
                        Submit Evidence
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaskCard;

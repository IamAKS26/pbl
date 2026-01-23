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
            className={`card relative group hover:shadow-lg transition-all duration-200 p-4 border-l-4 
                ${isCompleted ? 'border-green-500 bg-green-50/50' :
                    isPending ? 'border-yellow-400' : 'border-emerald-500'}
            `}
        >
            <div className="flex items-start justify-between mb-2">
                <h4 className={`font-medium text-gray-900 flex-1 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                </h4>
                <div className="flex gap-1">
                    {isPending && <span className="badge bg-yellow-100 text-yellow-800 text-xs">Under Review</span>}
                    {isCompleted && <span className="badge bg-green-100 text-green-800 text-xs">Done</span>}
                    {!isPending && !isCompleted && (
                        <span className={`badge ${getPriorityColor(task.priority)} text-xs ml-2`}>
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

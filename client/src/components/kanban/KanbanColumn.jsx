import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const KanbanColumn = ({ title, tasks, onTaskClick }) => {
    const { setNodeRef } = useDroppable({
        id: title,
    });

    return (
        <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className="space-y-3 min-h-[200px]"
            >
                <SortableContext
                    items={tasks.map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onClick={() => onTaskClick(task)}
                        />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const KanbanColumn = ({ title, tasks, onTaskClick }) => {
    const { setNodeRef } = useDroppable({
        id: title,
    });

    return (
        <div className="glass-panel p-4 flex flex-col h-full min-w-[300px] bg-white/40 border-white/60">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-display font-bold text-gray-800 tracking-tight">{title}</h3>
                <span className="bg-white/50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-white/50 shadow-sm">
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

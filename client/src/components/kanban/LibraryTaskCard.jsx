import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const LibraryTaskCard = ({ task, templateId }) => {
    // We use a unique ID for the library instance of the task
    const id = `lib-${templateId}-${task.title.replace(/\s+/g, '-').toLowerCase()}`;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useDraggable({
        id: id,
        data: {
            isLibraryTask: true,
            taskData: task
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl cursor-grab active:cursor-grabbing
                hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300 group
                ${isDragging ? 'shadow-2xl z-50 ring-2 ring-emerald-500 border-solid' : 'shadow-sm'}
            `}
        >
            <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition-colors">
                    {task.title}
                </h4>
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100">
                    <span className="text-gray-400 text-xs font-bold group-hover:text-emerald-600">+</span>
                </div>
            </div>
            {task.description && (
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
                    {task.description}
                </p>
            )}

            <div className="mt-2 flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gray-50 text-[10px] text-gray-400 rounded font-medium border border-gray-100 group-hover:border-emerald-100 group-hover:text-emerald-500 transition-colors">
                    Template Task
                </span>
            </div>
        </div>
    );
};

export default LibraryTaskCard;

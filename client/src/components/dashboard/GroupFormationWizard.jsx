import { useState, useEffect } from 'react';

const GroupFormationWizard = ({ students, onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [groupSize, setGroupSize] = useState(3);
    const [previewGroups, setPreviewGroups] = useState([]);
    const [generating, setGenerating] = useState(false);

    // Filter students who are already in a group? 
    // Ideally we might want to re-shuffle everyone or just unassigned. 
    // For now, let's assume we are shuffling the provided list (which should be all students or unassigned ones).

    const generatePreview = () => {
        setGenerating(true);
        // Simulate "Thinking" time for effect
        setTimeout(() => {
            const groups = balanceGroups(students, groupSize);
            setPreviewGroups(groups);
            setStep(2);
            setGenerating(false);
        }, 800);
    };

    const balanceGroups = (studentList, size) => {
        // 1. Calculate scores and sort
        const sortedStudents = [...studentList].map(s => ({
            ...s,
            avgScore: calculateAverage(s.mastery)
        })).sort((a, b) => b.avgScore - a.avgScore);

        const groups = [];
        const numGroups = Math.ceil(sortedStudents.length / size);

        // Initialize groups
        for (let i = 0; i < numGroups; i++) {
            groups.push({
                name: `Group ${i + 1}`,
                members: [],
                avgMastery: 0
            });
        }

        // Snake Draft
        // Round 1: 0, 1, 2...
        // Round 2: Last, Last-1...
        let currentStudentIdx = 0;
        let direction = 1; // 1 = forward, -1 = backward

        while (currentStudentIdx < sortedStudents.length) {
            if (direction === 1) {
                for (let i = 0; i < numGroups && currentStudentIdx < sortedStudents.length; i++) {
                    groups[i].members.push(sortedStudents[currentStudentIdx++]);
                }
                direction = -1;
            } else {
                for (let i = numGroups - 1; i >= 0 && currentStudentIdx < sortedStudents.length; i--) {
                    groups[i].members.push(sortedStudents[currentStudentIdx++]);
                }
                direction = 1;
            }
        }

        // Recalculate average mastery for display
        return groups.map(g => ({
            ...g,
            avgMastery: (g.members.reduce((acc, m) => acc + m.avgScore, 0) / (g.members.length || 1)).toFixed(1)
        })).filter(g => g.members.length > 0);
    };

    const calculateAverage = (mastery) => {
        if (!mastery || Object.keys(mastery).length === 0) return 0;
        const scores = Object.values(mastery);
        const sum = scores.reduce((a, b) => a + b, 0);
        return sum / scores.length;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        {step === 1 ? 'Configure Groups' : 'Review & Confirm'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-8 py-8">
                            <div className="max-w-md mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Target Group Size (Max 4)
                                </label>
                                <div className="flex items-center space-x-4">
                                    <span className="text-2xl font-bold text-emerald-600">{groupSize}</span>
                                    <input
                                        type="range"
                                        min="2"
                                        max="4"
                                        value={groupSize}
                                        onChange={(e) => setGroupSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    />
                                    <span className="text-gray-500 text-sm">Members</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 text-center">
                                    We'll use a snake-draft algorithm to balance mastery scores across teams.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {previewGroups.map((group, idx) => (
                                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-gray-800">{group.name}</h4>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Avg: {group.avgMastery}</span>
                                    </div>
                                    <ul className="space-y-1 text-sm">
                                        {group.members.map(m => (
                                            <li key={m._id} className="flex justify-between text-gray-600">
                                                <span>{m.name}</span>
                                                <span className="text-gray-400">{m.avgScore.toFixed(1)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 border-t pt-4 flex justify-between">
                    {step === 2 ? (
                        <button
                            onClick={() => setStep(1)}
                            className="btn btn-secondary"
                        >
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step === 1 ? (
                        <button
                            onClick={generatePreview}
                            disabled={generating}
                            className="btn btn-primary px-8"
                        >
                            {generating ? 'Calculating...' : 'Preview Groups →'}
                        </button>
                    ) : (
                        <button
                            onClick={() => onSave(previewGroups)}
                            className="btn btn-primary px-8 bg-gradient-to-r from-emerald-600 to-teal-600 border-none"
                        >
                            Confirm & Create Groups
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupFormationWizard;

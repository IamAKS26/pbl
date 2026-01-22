import React, { useState } from 'react';

const questions = [
    {
        id: 1,
        question: "What is the primary purpose of a REST API?",
        options: ["To style web pages", "To enable communication between systems", "To store data locally", "To compile Java code"],
        correct: 1
    },
    {
        id: 2,
        question: "Which HTTP method is used to create a new resource?",
        options: ["GET", "PUT", "POST", "DELETE"],
        correct: 2
    },
    {
        id: 3,
        question: "What does 'MERN' stand for?",
        options: ["Mongo, Express, React, Node", "MySQL, Express, Ruby, Node", "Mongo, Ember, React, Node", "MariaDB, Express, React, Nginx"],
        correct: 0
    }
];

const ExitTicket = ({ onClose, onComplete }) => {
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);

    const handleOptionSelect = (qId, optionIndex) => {
        setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    };

    const handleSubmit = () => {
        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct) correctCount++;
        });
        const finalScore = Math.round((correctCount / questions.length) * 100);
        setScore(finalScore);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl max-w-lg w-full p-8 shadow-2xl animate-scale-in relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-violet-600"></div>

                {!score && score !== 0 ? (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Exit Ticket 🎫</h2>
                        <p className="text-gray-600 mb-6">Prove your mastery to unlock the final report!</p>

                        <div className="space-y-6">
                            {questions.map((q, idx) => (
                                <div key={q.id}>
                                    <p className="font-medium text-gray-800 mb-2">{idx + 1}. {q.question}</p>
                                    <div className="space-y-2">
                                        {q.options.map((opt, i) => (
                                            <label key={i} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === i ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    checked={answers[q.id] === i}
                                                    onChange={() => handleOptionSelect(q.id, i)}
                                                    className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                                                />
                                                <span className="ml-3 text-sm text-gray-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                            <button
                                onClick={handleSubmit}
                                className="btn btn-primary bg-violet-600 hover:bg-violet-700"
                                disabled={Object.keys(answers).length < questions.length}
                            >
                                Submit Answers
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="text-6xl mb-4">{score >= 70 ? '🎉' : '📚'}</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Score: {score}%
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {score >= 70
                                ? "Excellent! Mission Accomplished."
                                : "Good effort, but you need 70% to pass. Try again!"}
                        </p>

                        <button
                            onClick={() => {
                                if (score >= 70) {
                                    onComplete({ score });
                                } else {
                                    setScore(null); // Reset
                                    setAnswers({});
                                }
                            }}
                            className="btn btn-primary w-full"
                        >
                            {score >= 70 ? "Generate My Report" : "Retry Quiz"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExitTicket;

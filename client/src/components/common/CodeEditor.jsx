import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../utils/api';

const LANGUAGES = [
    { id: 'javascript', name: 'JavaScript (Node.js)' },
    { id: 'python', name: 'Python 3' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
];

const CodeEditor = ({
    initialCode = '// Write your code here',
    language = 'javascript',
    onChange, // onCodeChange
    onLanguageChange,
    readOnly = false,
    height = "400px",
    allowRun = false // New prop to enable run even in readOnly
}) => {
    const [editorValue, setEditorValue] = useState(initialCode);
    const [currentLang, setCurrentLang] = useState(language);
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    // Sync prop changes
    useEffect(() => {
        if (language !== currentLang) {
            setCurrentLang(language);
        }
    }, [language]);

    // Sync initialCode changes if needed (optional, but good for resetting)
    useEffect(() => {
        setEditorValue(initialCode);
    }, [initialCode]);

    const handleEditorChange = (value) => {
        setEditorValue(value);
        if (onChange) {
            onChange(value);
        }
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setCurrentLang(newLang);
        if (onLanguageChange) {
            onLanguageChange(newLang);
        }
    };

    const handleRunCode = async () => {
        if (!editorValue) return;
        setIsRunning(true);
        setOutput(null);

        try {
            const res = await api.post('/api/run', {
                source_code: editorValue,
                language: currentLang
            });

            if (res.data.success) {
                setOutput(res.data.run);
            }
        } catch (error) {
            console.error(error);
            setOutput({
                code: 1,
                stderr: 'Failed to execute code. Server error.'
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {readOnly ? (
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {(LANGUAGES.find(l => l.id === currentLang)?.name || currentLang).toUpperCase()} EDITOR
                        </span>
                    ) : (
                        <select
                            value={currentLang}
                            onChange={handleLanguageChange}
                            className="bg-white border border-gray-200 text-gray-700 text-xs rounded-md px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-bold tracking-wide"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.id} value={lang.id}>{lang.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex gap-2">
                    {readOnly && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded flex items-center">READ ONLY</span>}
                    {(!readOnly || allowRun) && (
                        <button
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className={`btn btn-sm text-xs flex items-center gap-2 ${isRunning ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                            {isRunning ? (
                                <>
                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Running...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Run Code
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className={`relative ${output ? 'h-[60%]' : 'h-full flex-1'} transition-all duration-300`}>
                <Editor
                    height="100%"
                    defaultLanguage={currentLang === 'nodejs' ? 'javascript' : currentLang}
                    language={currentLang === 'nodejs' ? 'javascript' : currentLang}
                    defaultValue={initialCode}
                    value={editorValue}
                    onChange={handleEditorChange}
                    theme="light"
                    options={{
                        readOnly: readOnly,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        automaticLayout: true,
                        padding: { top: 16 }
                    }}
                />
            </div>

            {/* Output Console */}
            {output && (
                <div className="h-[40%] bg-gray-900 text-gray-100 p-0 border-t border-gray-200 font-mono text-sm flex flex-col animate-slide-up">
                    <div className="flex justify-between items-center px-4 py-1.5 bg-gray-800 border-b border-gray-700">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Terminal Output</span>
                        <button onClick={() => setOutput(null)} className="text-gray-400 hover:text-white text-xs">✕ Close</button>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                        {output.stdout && (
                            <pre className="whitespace-pre-wrap font-mono text-gray-200">{output.stdout}</pre>
                        )}
                        {output.stderr && (
                            <pre className="whitespace-pre-wrap text-red-400 mt-2">{output.stderr}</pre>
                        )}
                        {!output.stdout && !output.stderr && (
                            <div className="text-gray-500 italic text-xs">Program executed successfully with no output.</div>
                        )}
                        <div className="mt-4 pt-2 border-t border-gray-800 text-[10px] text-gray-500">
                            Exit Code: {output.code} {output.signal && `(Signal: ${output.signal})`}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeEditor;

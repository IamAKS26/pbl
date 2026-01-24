import { useState } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../utils/api';

const CodeEditor = ({
    initialCode = '// Write your code here',
    language = 'javascript',
    onChange,
    readOnly = false,
    height = "400px"
}) => {
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [editorValue, setEditorValue] = useState(initialCode);

    const handleEditorChange = (value) => {
        setEditorValue(value);
        if (onChange) {
            onChange(value);
        }
    };

    const handleRunCode = async () => {
        if (!editorValue) return;
        setIsRunning(true);
        setOutput(null);

        try {
            // Language ID mapping (partial list)
            // 63: JavaScript (Node.js 12.14.0)
            // 71: Python (3.8.1)
            // 62: Java (OpenJDK 13.0.1)
            // 50: C (GCC 9.2.0)
            // 54: C++ (GCC 9.2.0)

            let langId = 63; // Default JS
            if (language === 'python') langId = 71;
            if (language === 'java') langId = 62;
            if (language === 'c') langId = 50;
            if (language === 'cpp') langId = 54;

            const res = await api.post('/api/judge0/submit', {
                source_code: editorValue,
                language_id: langId
            });

            if (res.data.token) {
                // Poll for result
                checkStatus(res.data.token);
            }
        } catch (error) {
            console.error(error);
            setOutput({
                status: { description: 'Error' },
                stderr: 'Failed to submit code for execution.'
            });
            setIsRunning(false);
        }
    };

    const checkStatus = async (token) => {
        try {
            const res = await api.get(`/api/judge0/result/${token}`);
            const result = res.data.result;

            if (result.status.id <= 2) {
                // In Queue or Processing, wait and poll again
                setTimeout(() => checkStatus(token), 1000);
            } else {
                // Done (3: Accepted, others: Error/Wrong Answer)
                setOutput(result);
                setIsRunning(false);
            }
        } catch (error) {
            console.error(error);
            setOutput({
                status: { description: 'Error' },
                stderr: 'Failed to fetch execution result.'
            });
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 uppercase">{language}</span>
                <button
                    onClick={handleRunCode}
                    disabled={isRunning || readOnly}
                    className={`btn btn-sm ${isRunning ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                    {isRunning ? 'Running...' : 'Run Code ▶'}
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 min-h-[300px] relative">
                <Editor
                    height="100%"
                    defaultLanguage={language === 'nodejs' ? 'javascript' : language} // Monaco uses 'javascript'
                    defaultValue={initialCode}
                    value={initialCode}
                    onChange={handleEditorChange}
                    theme="light"
                    options={{
                        readOnly: readOnly,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        automaticLayout: true,
                    }}
                />
            </div>

            {/* Output Console */}
            <div className="bg-gray-900 text-gray-100 p-4 min-h-[150px] max-h-[300px] overflow-y-auto border-t border-gray-200 font-mono text-sm">
                <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Output Console</div>
                {output ? (
                    <div>
                        {output.stdout && (
                            <pre className="whitespace-pre-wrap">{output.stdout}</pre>
                        )}
                        {output.stderr && (
                            <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>
                        )}
                        {output.compile_output && (
                            <pre className="text-yellow-400 whitespace-pre-wrap">{output.compile_output}</pre>
                        )}
                        {!output.stdout && !output.stderr && !output.compile_output && (
                            <div className="text-gray-500 italic">No output</div>
                        )}
                        <div className="mt-2 text-xs text-gray-500 border-t border-gray-700 pt-1">
                            Status: <span className={output.status.id === 3 ? 'text-green-400' : 'text-red-400'}>{output.status.description}</span>
                            {output.time && <span className="ml-3">Time: {output.time}s</span>}
                            {output.memory && <span className="ml-3">Memory: {output.memory}KB</span>}
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-600 italic">
                        {isRunning ? 'Executing...' : 'Run code to see output here...'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditor;

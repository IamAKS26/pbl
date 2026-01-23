import Editor from '@monaco-editor/react';

const CodeEditor = ({
    initialCode = '// Write your code here',
    language = 'javascript',
    onChange,
    readOnly = false,
    height = "400px"
}) => {

    const handleEditorChange = (value) => {
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm h-full">
            <Editor
                height={height}
                defaultLanguage={language}
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
    );
};

export default CodeEditor;

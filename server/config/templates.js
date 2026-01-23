const templates = {
    'todo-app': {
        title: 'To-Do List Application',
        description: 'Build a fully functional To-Do List app where users can add, edit, delete, and mark tasks as complete. Use HTML, CSS, and Vanilla JavaScript.',
        deadlineOffsetDays: 7, // 1 week from assignment
        columns: ['Backlog', 'In Progress', 'Ready for Review', 'Done'],
        tasks: [
            {
                title: 'Project Setup & Structure',
                description: 'Create the project folder structure. Create index.html, style.css, and app.js. Link them correctly.',
                priority: 'High',
                submissionType: 'code'
            },
            {
                title: 'HTML Structure Implementation',
                description: 'Write the HTML structure. You need an input field, an "Add" button, and a container (ul or div) for the list items.',
                priority: 'High',
                submissionType: 'code'
            },
            {
                title: 'CSS Styling',
                description: 'Style your application to look professional. Use flexbox or grid for layout. Make sure it looks good on mobile.',
                priority: 'Medium',
                submissionType: 'code'
            },
            {
                title: 'JS: Add Task Functionality',
                description: 'Write a function to read the input value and add a new list item to the DOM when the "Add" button is clicked.',
                priority: 'High',
                submissionType: 'code'
            },
            {
                title: 'JS: Delete & Complete',
                description: 'Add functionality to remove a task or mark it as done (e.g., strikethrough style) when clicked.',
                priority: 'Medium',
                submissionType: 'code'
            },
            {
                title: 'Final Review & Refactor',
                description: 'Clean up your code. Remove unused variables. Add comments. Ensure variable names are meaningful.',
                priority: 'Low',
                submissionType: 'code'
            }
        ]
    }
};

module.exports = templates;

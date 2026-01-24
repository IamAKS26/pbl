export const PROJECT_TEMPLATES = [
    {
        id: 'todo-app',
        title: 'To-Do List Application',
        description: 'Build a fully functional To-Do List app using HTML, CSS, and Vanilla JavaScript. Perfect for beginners.',
        stack: ['HTML', 'CSS', 'JavaScript'],
        difficulty: 'Beginner',
        suggestedTasks: [
            { title: 'Setup GitHub Repo', description: 'Initialize a new repository and add collaborators.' },
            { title: 'Design Mockup', description: 'Create a wireframe for the To-Do list UI.' },
            { title: 'HTML Structure', description: 'Write the HTML boilerplate and main elements.' },
            { title: 'CSS Styling', description: 'Style the application using CSS Flexbox/Grid.' },
            { title: 'JS Logic: Add Item', description: 'Implement function to add new items to the list.' },
            { title: 'JS Logic: Delete Item', description: 'Implement function to remove items.' },
            { title: 'Local Storage', description: 'Save the list to LocalStorage for persistence.' },
        ]
    },
    {
        id: 'weather-app',
        title: 'Weather Dashboard',
        description: 'Create a weather dashboard using a 3rd party API.',
        stack: ['React', 'API'],
        difficulty: 'Medium',
        suggestedTasks: [
            { title: 'API Key Setup', description: 'Get an API key from OpenWeatherMap.' },
            { title: 'Fetch Data', description: 'Create a service to fetch weather data.' },
            { title: 'Display Weather', description: 'Show current temperature and conditions.' }
        ]
    }
    // Add more templates here in the future
];

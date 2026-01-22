const axios = require('axios');

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Fetch commits from a GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} token - GitHub personal access token (optional)
 * @returns {Promise<Array>} Array of commit objects
 */
const fetchCommits = async (owner, repo, token = null) => {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
        };

        // Add authorization if token is provided
        if (token || process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${token || process.env.GITHUB_TOKEN}`;
        }

        const response = await axios.get(
            `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits`,
            { headers }
        );

        // Parse and return commit data
        return response.data.map(commit => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            email: commit.commit.author.email,
            timestamp: commit.commit.author.date,
            url: commit.html_url,
        }));
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Repository not found');
        } else if (error.response?.status === 403) {
            throw new Error('GitHub API rate limit exceeded. Please add a GitHub token.');
        }
        throw new Error(`GitHub API Error: ${error.message}`);
    }
};

/**
 * Fetch contributor statistics from a GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} token - GitHub personal access token (optional)
 * @returns {Promise<Array>} Array of contributor stats
 */
const fetchContributorStats = async (owner, repo, token = null) => {
    try {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (token || process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${token || process.env.GITHUB_TOKEN}`;
        }

        const response = await axios.get(
            `${GITHUB_API_BASE}/repos/${owner}/${repo}/stats/contributors`,
            { headers }
        );

        // API returns 202 Accepted if stats are computing. Retry needed in real prod, but simple return for now.
        if (response.status === 202) {
            return []; // Stats computing, handle gracefully
        }

        return response.data.map(stat => ({
            author: stat.author.login,
            totalCommits: stat.total,
            weeks: stat.weeks // Weekly breakdown
        }));
    } catch (error) {
        console.error('GitHub Stats Error:', error.message);
        return []; // Return empty on error to not block flow
    }
};

/**
 * Parse GitHub repository URL
 * @param {string} url - GitHub repository URL
 * @returns {Object} Object with owner and repo
 */
const parseGitHubUrl = (url) => {
    const regex = /github\.com\/([^\/]+)\/([^\/\.]+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('Invalid GitHub repository URL');
    }

    return {
        owner: match[1],
        repo: match[2],
    };
};

module.exports = {
    fetchCommits,
    fetchContributorStats,
    parseGitHubUrl,
};

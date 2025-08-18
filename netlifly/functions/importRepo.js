const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { sourceURL, repoName, private: isPrivate = false, description = '' } = JSON.parse(event.body);

    if (!repoName || !sourceURL) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'repoName and sourceURL are required' }),
      };
    }

    const token = process.env.GITHUB_TOKEN;
    const user ="ishakuyusufmaina"; //process.env.GITHUB_USER;

    // 1. Create repo
    const createResp = await axios.post(
      'https://api.github.com/user/repos',
      {
        name: repoName,
        private: isPrivate,
        description,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    // 2. Trigger import
    const importResp = await axios.put(
      `https://api.github.com/repos/${user}/${repoName}/import`,
      {
        vcs: 'git',
        vcs_url: sourceURL,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Repository created and import started',
        repo: createResp.data.html_url,
        importStatus: importResp.data,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.response?.data?.message || error.message,
        details: error.response?.data,
      }),
    };
  }
};

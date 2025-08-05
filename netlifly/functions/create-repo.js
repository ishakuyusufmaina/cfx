const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { repoName, private: isPrivate = false, description = '' } = JSON.parse(event.body);

    if (!repoName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'repoName is required' }),
      };
    }

    const token = process.env.GITHUB_TOKEN;

    const response = await axios.post(
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Repository created successfully',
        url: response.data.html_url,
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

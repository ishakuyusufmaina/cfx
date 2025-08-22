// functions/upload-file.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const { content, path, repo } = JSON.parse(event.body || "{}");
    if (!content || !path || !repo) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: content, path, repo" }),
      };
    }

    // Ensure you set this in your Netlify environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GitHub token not configured" }),
      };
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    // Split repo into owner and repo
    const [owner, repoName] = repo.split("/");

    // Upload the file (GitHub expects base64 content)
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path,
      message: `Add/Update ${path}`,
      content: Buffer.from(content).toString("base64"),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
        data: response.data,
      }),
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};

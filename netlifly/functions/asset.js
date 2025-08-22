// netlify/functions/uploadFiles.js
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GH_TOKEN, // set this in your environment variables
});

const OWNER = "ishakuyusufmaina";
//const REPO = "your-repo-name";
const BRANCH = "main"; // or "master"

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const body = JSON.parse(event.body);
    const { files, REPO} = body;

    if (!files || !Array.isArray(files)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid payload" }),
      };
    }

    const results = [];

    for (const file of files) {
      const { path, content } = file;

      // Get current SHA if file exists
      let sha = undefined;
      try {
        const { data } = await octokit.repos.getContent({
          owner: OWNER,
          repo: REPO,
          path,
          ref: BRANCH,
        });
        sha = data.sha;
      } catch (err) {
        if (err.status !== 404) throw err;
      }

      // Create or update file
      const { data } = await octokit.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path,
        message: `Add/Update ${path}`,
        content: Buffer.from(content).toString("base64"),
        branch: BRANCH,
        sha,
      });

      results.push({ path, status: "uploaded", url: data.content.html_url });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, results }),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

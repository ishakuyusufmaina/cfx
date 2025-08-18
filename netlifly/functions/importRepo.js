const fetch = require("node-fetch");

export default async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Only POST allowed" })
      };
    }

    const { sourceURL, repoName } = JSON.parse(event.body || "{}");

    if (!sourceURL || !repoName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "sourceURL and repoName required" })
      };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_USER = "ishakuyusufmaina"; // or process.env.GITHUB_USER

    if (!GITHUB_TOKEN || !GITHUB_USER) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GitHub credentials not configured" })
      };
    }

    // 1. Create GitHub repository
    const createRepoResp = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json`
      },
      body: JSON.stringify({
        name: repoName,
        private: false
      })
    });

    if (!createRepoResp.ok) {
      const errText = await createRepoResp.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to create repo", details: errText })
      };
    }

    // 2. Trigger GitHub Import
    const importResp = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${repoName}/import`,
      {
        method: "PUT",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json`
        },
        body: JSON.stringify({
          vcs: "git",
          vcs_url: sourceURL
        })
      }
    );

    if (!importResp.ok) {
      const errText = await importResp.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Import failed", details: errText })
      };
    }

    const importData = await importResp.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Repo created and import started",
        importStatus: importData
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

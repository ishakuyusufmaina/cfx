// netlify/functions/importRepo.js
const fetch = require("node-fetch");

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { sourceURL, repoName } = await req.json();

    if (!sourceURL || !repoName) {
      return res.status(400).json({ error: "sourceURL and repoName required" });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_USER = "ishakuyusufmaina"; //process.env.GITHUB_USER; // set this in Netlify env vars

    if (!GITHUB_TOKEN || !GITHUB_USER) {
      return res.status(500).json({ error: "GitHub credentials not configured" });
    }

    // 1. Create GitHub repository
    const createRepoResp = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json"
      },
      body: JSON.stringify({
        name: repoName,
        private: false
      })
    });

    if (!createRepoResp.ok) {
      const errText = await createRepoResp.text();
      return res.status(500).json({ error: "Failed to create repo", details: errText });
    }

    // 2. Trigger GitHub Import
    const importResp = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${repoName}/import`,
      {
        method: "PUT",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json"
        },
        body: JSON.stringify({
          vcs: "git",
          vcs_url: sourceURL
        })
      }
    );

    if (!importResp.ok) {
      const errText = await importResp.text();
      return res.status(500).json({ error: "Import failed", details: errText });
    }

    const importData = await importResp.json();

    return res.status(200).json({
      success: true,
      message: "Repo created and import started",
      importStatus: importData
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// netlify/functions/trigger-workflow.js
// Receives { repoName, sourceURL } and dispatches a GitHub repository_dispatch event.
// Required Netlify env vars:
//   GH_TOKEN            -> a GitHub PAT with repo + workflow scopes
//   GH_OWNER            -> the GitHub username or org that owns the automation repo
//   GH_AUTOMATION_REPO  -> the repository that contains the workflow yaml
// Optional:
//   EVENT_TYPE          -> defaults to 'clone-repo'

const EVENT_TYPE = /*process.env.EVENT_TYPE ||*/ "clone-repo";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { repoName, sourceURL } = JSON.parse(event.body || "{}");
    if (!repoName || !sourceURL) {
      return { statusCode: 400, body: JSON.stringify({ error: "repoName and sourceURL are required" }) };
    }

    const token = process.env.GH_TOKEN;
    const owner = "ishakuyusufmaina"; // process.env.GH_OWNER;
    const automationRepo = "safa3"; // process.env.GH_AUTOMATION_REPO;
    if (!token || !owner || !automationRepo) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server is missing GH_TOKEN, GH_OWNER, or GH_AUTOMATION_REPO" }) };
    }

    const url = `https://api.github.com/repos/${owner}/${automationRepo}/dispatches`;
    const payload = {
      event_type: EVENT_TYPE,
      client_payload: { repoName, sourceURL, owner }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: `GitHub dispatch failed: ${text}` }) };
    }

    // GitHub returns 204 No Content for successful dispatch
    return { statusCode: 200, body: JSON.stringify({ ok: true, requestId: event.headers["x-nf-request-id"] || null }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};

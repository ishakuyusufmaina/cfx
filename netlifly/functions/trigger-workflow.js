// netlify/functions/trigger-workflow.js
// This version creates the target repo before dispatching workflow

const EVENT_TYPE = /* process.env.EVENT_TYPE || */ "clone-repo";

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
    const owner = "ishakuyusufmaina";// process.env.GH_OWNER;
    const automationRepo = "safa3";//process.env.GH_AUTOMATION_REPO;
    if (!token || !owner || !automationRepo) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server is missing GH_TOKEN, GH_OWNER, or GH_AUTOMATION_REPO" }) };
    }

    // Step 1: Try to create the repo (under the authenticated user)
    const createUrl = `https://api.github.com/user/repos`;
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: repoName, private: false })
    });

    if (createRes.status === 422) {
      // Repo already exists
      console.log(`Repo ${repoName} already exists, continuing...`);
    } else if (!createRes.ok) {
      const errText = await createRes.text();
      return { statusCode: createRes.status, body: JSON.stringify({ error: `Failed to create repo: ${errText}` }) };
    }

    // Step 2: Dispatch workflow
    const dispatchUrl = `https://api.github.com/repos/${owner}/${automationRepo}/dispatches`;
    const payload = {
      event_type: EVENT_TYPE,
      client_payload: { repoName, sourceURL, owner }
    };

    const dispatchRes = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!dispatchRes.ok) {
      const text = await dispatchRes.text();
      return { statusCode: dispatchRes.status, body: JSON.stringify({ error: `Dispatch failed: ${text}` }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, repo: repoName, source: sourceURL }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};

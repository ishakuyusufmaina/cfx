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

    const { repo, files } = JSON.parse(event.body || "{}");
    if (!repo || !files || !Array.isArray(files) || files.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing repo or files[]" }),
      };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GitHub token not configured" }),
      };
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const [owner, repoName] = repo.split("/");

    // 1. Get the default branch (usually "main" or "master")
    const repoInfo = await octokit.repos.get({ owner, repo: repoName });
    const baseBranch = repoInfo.data.default_branch;

    // 2. Get the latest commit SHA on the branch
    const ref = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${baseBranch}`,
    });
    const latestCommitSha = ref.data.object.sha;

    // 3. Get the tree SHA of the latest commit
    const commit = await octokit.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commit.data.tree.sha;

    // 4. Create blobs for all files
    const blobs = await Promise.all(
      files.map(async (file) => {
        const blob = await octokit.git.createBlob({
          owner,
          repo: repoName,
          content: file.content, // already base64
          encoding: "base64",
        });
        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.data.sha,
        };
      })
    );

    // 5. Create a new tree with the blobs
    const newTree = await octokit.git.createTree({
      owner,
      repo: repoName,
      tree: blobs,
      base_tree: baseTreeSha,
    });

    // 6. Create a new commit
    const newCommit = await octokit.git.createCommit({
      owner,
      repo: repoName,
      message: `Upload ${files.length} file(s) via Netlify`,
      tree: newTree.data.sha,
      parents: [latestCommitSha],
    });

    // 7. Update the branch ref to point to the new commit
    await octokit.git.updateRef({
      owner,
      repo: repoName,
      ref: `heads/${baseBranch}`,
      sha: newCommit.data.sha,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files uploaded successfully",
        commitUrl: newCommit.data.html_url,
        files: files.map(f => f.path),
      }),
    };
  } catch (error) {
    console.error("Error uploading files:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};

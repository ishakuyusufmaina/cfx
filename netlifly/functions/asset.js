const { Octokit }  = require("@octokit/rest");
const github = process.env.GH_TOKEN;
const owner = "ishakuyusufmaina";//process.env.GITHUB_OWNER;
const branch = /*process.env.GITHUB_BRANCH || */ "main";

const octokit = new Octokit({ auth: github });

exports.handler = async (event) => {
  
  try {
    
    const {files, repo} = JSON.parse(event.body); 
    const blobs = await Promise.all(
      files.map(f =>
        octokit.git.createBlob({
          owner, repo,
          content: f.contentBase64,
          encoding: "base64"
        })
      )
    );

    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const baseSha = refData.object.sha;

    const { data: treeData } = await octokit.git.getTree({ owner, repo, tree_sha: baseSha });
    const tree = await octokit.git.createTree({
      owner, repo,
      base_tree: treeData.sha,
      tree: files.map((f, i) => ({
        path: f.path,
        mode: "100644",
        type: "blob",
        sha: blobs[i].sha
      }))
    });

    const commit = await octokit.git.createCommit({
      owner, repo,
      message: files.length > 1
        ? `Add/update ${files.length} files`
        : `Add/update ${files[0].path}`,
      tree: tree.sha,
      parents: [baseSha]
    });

    await octokit.git.updateRef({
      owner, repo,
      ref: `heads/${branch}`,
      sha: commit.sha
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success", commitSha: commit.sha })
    };
  } catch (err) {
    console.log("Error, I wrote: ");
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

exports.handler = async (event)=>{
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const username= "ishakuyusufmaina";
  const token = process.GH_TOKEN;
  const repo = JSON.parse(event.body).schoolId;
  const branch= "main";
  const response = await fetch(`https://api.github.com/repos/${username}/${repo}/pages`, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: {
            branch: branch,
            path: "/"
          }
        })
      });

    //  const data = await response.json();

      if (response.ok) {
        const url = `https://${username}.github.io/${repo}/`;
        return {
          statusCode: 200,
          ok: true,
          body: JSON.stringify({
            message: `App published! @ ${url}`
          })
        }
      } else {
        return {
          statusCode: response.statusCode,
          error: "App publication failed"
          
        }
      }
}

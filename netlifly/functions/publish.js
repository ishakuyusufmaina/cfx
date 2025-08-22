exports.handler = async (event)=>{
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const username= "ishakuyusufmaina";
  const token = process.env.GH_TOKEN;
  const repo = JSON.parse(event.body).schoolId;
  const branch= "main";
  try {
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

     const data = await response.text();

      if (response.ok) {
        const url = `https://${username}.github.io/${repo}/`;
        return {
          statusCode: 200,
          ok: true,
          body: JSON.stringify({
            message: `App published! @ ${url}`
          })
        }
      }
  return {
    statusCode: 500,
    body: JSON.stringify({error: "App publication failed "+data})
  }
  } catch(e){
    return {
      statusCode: 500,
      body: JSON.stringify({error: e.message})
    }
  }
}

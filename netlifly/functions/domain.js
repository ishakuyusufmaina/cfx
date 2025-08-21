const token = process.env.GH_TOKEN;
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const repo = JSON.parse(event.body).repoName;
  const subdomain = JSON.parse(event.body).domain;
  const owner = "ishakuyusufmaina";
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/CNAME`;
  const content = Buffer.from(`${subdomain}.mainafly.com`, "utf-8").toString("base64");

  try {
    const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
    const data = await response.json();

   if (response.ok) {
     return {
       statusCode: 200,
       body: JSON.stringify({ok: true, message: `${repo} is published @ ${subdomain}.mainafly.com`})
       
     }
   }
    return {
      statusCode: 500,
       body: JSON.stringify({error: "domain setting failed"})
       
     } 
  } catch(e){
    return {
      statusCode: 500,
      body: JSON.stringify({error: e.message})
    }
  }
  
}

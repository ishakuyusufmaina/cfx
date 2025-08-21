const token = process.env.GH_TOKEN;
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const schoolId= JSON.parse(event.body).schoolId;
  const schoolName= JSON.parse(event.body).schoolName;
  const owner = "ishakuyusufmaina";
  const url = `https://api.github.com/repos/${owner}/${schoolId}/contents/config.js`;
  const content = `
  const schoolId = "${schoolId}"
  const schoolName = "${schoolName.toUpperCase()}"
  `;
  const contentBase64 = Buffer.from(content, "utf-8").toString("base64");
      const body = {
        message: "Config uploaded via API",
        content: contentBase64
      };
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
 //
  const data = await response.text();

   if (response.ok) 
     return {
       statusCode: 200,
       body: JSON.stringify({ok: true, message:  "configuration done"})
       
     }
     
    return {
       statusCode: 500,
       body: JSON.stringify({error: "configuration failed " + data})
       
     } 
  } catch(e){
    return {
      statusCode: 500,
      body: JSON.stringify({error: e.message})
    }
  }
  
}

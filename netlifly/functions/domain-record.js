exports.handler = async (event)=>{
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  const token = process.env.CF_TOKEN;
  const zoneId = process.env.ZONE_ID;
  const subdomain = JSON.parse(event.body).schoolDomain;
  const target = "ishakuyusufmaina.github.io"; // fixed target
  const data = {
    type: "CNAME",
    name: subdomain,
    content: target,
    ttl: 1,
    proxied: false
  };
  
  try { 
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
     //const result = await response.json();
    if (response.ok)
      return {
        ok: true,
        statusCode: 200,
        body: JSON.stringify({message: "domain name registered"})
      }
    return {
       statusCode: response.statusCode,
       body: JSON.stringify({error: "Failed to register domain"})
    }
    
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({error: e.message})
        
    }
  }

}


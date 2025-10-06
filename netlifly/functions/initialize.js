const fetch = require("node-fetch");

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*", // You can restrict this to your domain
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight (OPTIONS) request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }
  
  try {
    const { email, amount, schoolId } = JSON.parse(event.body || "{}");

    if (!email || !amount || !schoolId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Initialize Paystack transaction
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PS_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        callback_url: `https://cfx-mainafly.netlify.app/.netlify/functions/callback?schoolId=${schoolId}`,
      }),
    });

    const data = await res.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Initialize error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

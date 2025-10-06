import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { email, amount, schoolId } = JSON.parse(event.body || "{}");

    if (!email || !amount || !schoolId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Create transaction on Paystack
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PS_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
        callback_url: `https://cfx-mainafly.netlify.app/.netlify/functions/callback?schoolId=${schoolId}`,
      }),
    });

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}

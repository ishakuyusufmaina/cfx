// Netlify Function: Get Nigerian Banks via Paystack API

export.handler = async (event, context) {
  try {
    // Your Paystack secret key (store it in Netlify environment variables)
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing PAYSTACK_SECRET_KEY in environment variables" }),
      };
    }

    // Call Paystack API to fetch banks
    const response = await fetch("https://api.paystack.co/bank", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Failed to fetch banks from Paystack", details: data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data.data), // return only the list of banks
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

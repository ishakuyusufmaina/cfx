// Netlify Function: Verify Account Number via Paystack API
// Expects query params: account_number, bank_code

exports.handler = async (event, context) => {
  try {
    const PAYSTACK_SECRET_KEY = process.env.PS_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing PAYSTACK_SECRET_KEY in environment variables" }),
      };
    }

    // Extract query parameters
    const { account_number, bank_code } = event.queryStringParameters;

    if (!account_number || !bank_code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "account_number and bank_code are required" }),
      };
    }

    // Call Paystack API to resolve account
    const url = `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`;
    const response = await fetch(url, {
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
        body: JSON.stringify({ error: "Failed to resolve account", details: data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data.data), // returns account_name, account_number, bank_id
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

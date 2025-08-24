// Netlify Function: resolveAccount
// File: netlify/functions/resolveAccount.js

const axios = require("axios");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { account_number, bank_code } = JSON.parse(event.body);

    if (!account_number || !bank_code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "account_number and bank_code are required" }),
      };
    }

    const PAYSTACK_SECRET_KEY = process.env.PS_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing PAYSTACK_SECRET_KEY in environment variables" }),
      };
    }

    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.response?.data || "Something went wrong",
      }),
    };
  }
};

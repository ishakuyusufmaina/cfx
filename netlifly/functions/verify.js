const axios = require('axios');

exports.handler = async function(event, context) {
  const reference = event.queryStringParameters.reference;

  if (!reference) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing reference" })
    };
  }

  try {
    const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxx` // your secret key
      }
    });

    const { data } = res.data;

    if (data.status === 'success' && data.amount === 10000) {
      // You can store transaction info here (optional)
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'success', data })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ status: 'failed', data })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error", details: error.message })
    };
  }
};

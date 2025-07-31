const axios = require('axios');

exports.handler = async function(event, context) {
  //const reference = event.queryStringParameters.reference;
const data = JSON.parse(event.body);  // Parse JSON payload
const reference = data.reference;     // Access the "reference" field
  
  if (!reference) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing reference" })
    };
  }

  try {
    const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer sk_live_10dfe269ce4fa26d99590a6b0af454adc07577c3` // your secret key
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

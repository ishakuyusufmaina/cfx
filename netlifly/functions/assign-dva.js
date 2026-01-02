exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { customerCode, preferredBank } = JSON.parse(event.body);

    if (!customerCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "customerCode is required" }),
      };
    }

    const response = await fetch(
      "https://api.paystack.co/dedicated_account/assign",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: customerCode,
          preferred_bank: preferredBank || "wema-bank",
        }),
      }
    );

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify({
        success: true,
        message: "Dedicated account assigned",
        data,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};

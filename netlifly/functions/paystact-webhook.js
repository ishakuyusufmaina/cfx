const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    // Paystack sends POST requests
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const paystackSignature = event.headers["x-paystack-signature"];
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Verify signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(event.body)
      .digest("hex");

    if (hash !== paystackSignature) {
      return { statusCode: 401, body: "Invalid signature" };
    }

    const payload = JSON.parse(event.body);
    const { event: eventType, data } = payload;

    // Handle events
    switch (eventType) {
      case "charge.success":
        console.log("Payment successful:", data.reference);
        // TODO: update DB, activate subscription, etc.
        break;

      case "transfer.success":
        console.log("Transfer successful:", data.id);
        break;

      default:
        console.log("Unhandled event:", eventType);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error("Webhook error:", error);
    return { statusCode: 500, body: "Server Error" };
  }
};

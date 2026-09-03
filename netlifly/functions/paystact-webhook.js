const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    // Paystack sends POST requests
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const paystackSignature = event.headers["x-paystack-signature"];
    const secret = process.env.MSS_PS;

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
      case "dedicatedaccount.assign.success":
        const dva = data.dedicated_account;
       
        break;
      
      case "charge.success":
         if (meta.customerType==="jamb"){
           const meta = data.customer.metadata;
           const jambPayment = {
             name: meta.name,
             email: meta.email,
             reference: data.reference,
             PS_SECRET: secret,
             subjects: Jmeta.subjects
           };
           console.log(jambPayment);
           const response = await fetch("https://jamb-affirm.yusufmainaishaku.workers.dev", {
             method: "POST",
             headers: {"Content-Type": "application/json"},
             body: JSON.stringify(jambPayment)
           });
           
           if (response.status !== 202) return { statusCode: 500, body: "Payment affirmation request failed" };
           console.log("JAMB Payment received and affirmed: "+ JSON.stringify(jambPayment));
         }
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


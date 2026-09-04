const crypto = require("crypto");
const admin = require("firebase-admin");

const ALLOWED_ORIGIN = "https://mainafly.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};



exports.handler = async (event) => {

  // 🔹 CORS preflight
  

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { name, email, reference, subjects, FB_CONFIG } =
      JSON.parse(event.body || "{}");

    console.log({ name, email, reference, subjects, FB_CONFIG });
    
      if (!admin.apps.length) admin.initializeApp({
        credential: admin.credential.cert(
        JSON.parse(FB_CONFIG)
       ),
      });
    
    if (!name || !reference || !email || !subjects) {
      return {
        statusCode: 400,
        body: JSON.stringify({message:"Incomplete transaction details", error: "incomplete payload"})
      };
    }
    
    const db = admin.firestore();
    console.log("before commit");
    await db.collection("registered-subjects")
    .doc(email).set(subjects, {merge:true});
    await db.collection("transactions")
    .add({ name, email, reference, subjects, createdAt: admin.firestore.FieldValue.serverTimestamp()});

    return {
      statusCode: 201,
      body: JSON.stringify({success: true})
    }
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({message: "Internal server error: ", "error": e.message})
    }
    
  }

}


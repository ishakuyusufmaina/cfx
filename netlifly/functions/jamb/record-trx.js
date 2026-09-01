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
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { name, email, reference, subjects } =
      JSON.parse(event.body || "{}");

      admin.initializeApp({
        credential: admin.credential.cert(
        JSON.parse(FB_CONFIG)
       ),
      });
    const db = admin.firestore();
    

  }


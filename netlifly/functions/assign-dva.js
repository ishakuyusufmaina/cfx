const crypto = require("crypto");
const admin = require("firebase-admin");

const ALLOWED_ORIGIN = "https://innovative.mainafly.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

if (!admin.apps.some(app => app.name === "unity")) {
  admin.initializeApp(
    {
      credential: admin.credential.cert(
        JSON.parse(process.env.UNITY_CONFIG)
      ),
    },
    "unity"
  );
}

const udb = admin.app("unity").firestore();
const secretsCol = udb.collection("secrets");

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
    const { studentId, schoolId, schoolBatch, term, session } =
      JSON.parse(event.body || "{}");

    const requiredFields = { studentId, schoolId, schoolBatch, term, session };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Missing required fields",
          missingFields,
        }),
      };
    }

    const schoolSecretRef = secretsCol.doc(schoolBatch);
    const schoolSecretDoc = await schoolSecretRef.get();
    const schoolSecret = schoolSecretDoc.data().root;

    if (!admin.apps.some(app => app.name === "school")) {
      admin.initializeApp(
        {
          credential: admin.credential.cert(JSON.parse(schoolSecret)),
        },
        "school"
      );
    }

    const schoolDb = admin.app("school").firestore();

    const schoolProfileDoc = await schoolDb
      .collection(schoolId)
      .doc("profile")
      .get();

    const schoolProfile = schoolProfileDoc.data();

    const stdDoc = await schoolDb
      .collection(schoolId)
      .doc("db")
      .collection("students")
      .doc(studentId)
      .get();

    const std = stdDoc.data();
    const stdNames = std.name.replace(/\s+/g, " ").trim().split(" ");

    const data = {
      email: `${schoolId}.${studentId}@gmail.com`,
      first_name: stdNames[0],
      middle_name: stdNames[1] || "",
      last_name: stdNames[stdNames.length - 1],
      phone: schoolProfile.phoneNumber,
      country: "NG",
      split_code: schoolProfile.splitCode,
      metadata: {
        studentName: std.name,
        studentId,
        schoolId,
        schoolBatch,
        class: std.class,
        session,
        term,
        for: "school-fees",
      },
    };

    const response = await fetch(
      "https://api.paystack.co/dedicated_account/assign",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MSS_PS}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const res_data = await response.json();

    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: "Dedicated account assigned",
        data: res_data,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};

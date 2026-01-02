const crypto = require("crypto");
const admin = require("firebase-admin");

if (!admin.apps.some(app=>app.name=="unity")) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.UNITY_CONFIG))
  },
  "unity"
  )  
}
const udb = admin.app("unity").firestore();
const secretsCol = udb.collection("secrets");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const paystackSignature = event.headers["x-paystack-signature"];
    const secret = process.env.MSS_PS;

    // Verify signature

    const { studentId, schoolId, schoolBatch, term, session } = JSON.parse(event.body || "{}");
    const requiredFields = { studentId, schoolId, schoolBatch, term, session };
    const missingFields = Object.entries(requiredFields)
       .filter(([_, value]) => !value)
        .map(([key]) => key);
    
    if (missingFields.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required fields",
          missingFields
        })
      };
    }
    
    
    const schoolSecretRef = secretsCol.doc(schoolBatch)
     const schoolSecretDoc = await schoolSecretRef.get()
    const schoolSecret = schoolSecretDoc.data().root;
    if (!admin.apps.some(app=>app.name=="school")){
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(schoolSecret))
      },
      "school"
     )
    }
    const schoolDb = admin.app("school").firestore();
    const schoolProfileRef =  schoolDb
      .collection(schoolId)
      .doc("profile");
    const schoolProfileDoc = await schoolProfileRef.get();
    const schoolProfile = schoolProfileDoc.data();
    const stdRef = schoolDb
      .collection(schoolId)
      .doc("db")
      .collection("students")
      .doc(studentId);
    const std = await stdRef.get().data();
    const stdNames = std.name.replace(/\s+/g, ' ').trim().split(" ");
    const data={ 
      "email": `${schoolId}.${studentId}@gmail.com`,
      "first_name": stdNames[0],
      "middle_name": stdNames.length==3? stdNames[1] : "",
      "last_name": stdNames[stdNames.length-1],
      "phone": schoolProfile.phoneNumber,
      "country": "NG",
       split_code: schoolProfile.splitCode,
       "metadata": {
           studentName: std.name,
           studentId,
           schoolId,
           "class": std.class,
           session,
           term,
           "for": "school-fees"
         }
       }

    const response = await fetch(
      "https://api.paystack.co/dedicated_account/assign",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const res_data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify({
        success: true,
        message: "Dedicated account assigned",
        data: res_data
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

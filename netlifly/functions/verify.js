//const admin = require("firebase-admin");

let initialized = false;

exports.handler = async function(event, context) {
  return 455667777;
  if (!initialized) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
  }

  const db = admin.firestore();

  // Example: Get a document from 'users' collection
  const docRef = db.collection("students").doc("yusufmainaishaku@gmail.com");

  try {
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        body: "Document not found",
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(doc.data()),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

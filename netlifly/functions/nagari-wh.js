const admin = require("firebase-admin");
console.log("Bismillah");
// Initialize main Unity Firebase app (global)
if (!admin.apps.some(app => app.name === "unity")) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.UNITY_CONFIG)),
  }, "unity");
}

const udb = admin.app("unity").firestore();
const secretsCol = udb.collection("secrets");

exports.handler = async (event) => {
  try {
    // Parse webhook payload
    const payload = JSON.parse(event.body);
   // const { event: eventType, data } = payload;
    const data = payload;
    const meta = data.context;             // Cloudinary context
    const cloudUrl = data.secure_url || data.url; // Image URL
    console.log("context: ", JSON.stringify(data.context))
    if (!cloudUrl) {
      throw new Error("No Cloudinary URL found in payload.");
    }

    // Retrieve app secret
    const secretRef = secretsCol.doc(meta.id);
    const secretDoc = await secretRef.get();

    if (!secretDoc.exists) {
      throw new Error(`No secret found for id: ${meta.id}`);
    }

    const schoolSecret = secretDoc.data().root;

    // Initialize per-school Firebase app dynamically
    if (!admin.apps.some(app => app.name === "app")) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(schoolSecret))
      }, "app");
    }

    const db = admin.app("app").firestore();

    // Construct data object
    const fileData = {
      tag: meta.tag,
      patientNumber: meta.patientNumber,
      createdBy: meta.createdBy,
      url: cloudUrl,
      type: data.resource_type || "image",
      createdAt: admin.firestore.Timestamp.now()
    };

    // Save to "files" collection
    await db.collection("files").add(fileData);
    console.log("Successfully uploaded");
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };

  } catch (error) {
    console.error("Webhook error:", error);
    return {
      statusCode: 500,
      body: "Server Error"
    };
  }
};

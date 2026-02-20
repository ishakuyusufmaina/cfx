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
    const { operator, appId, email, password } = payload;

    if (!operator || !appId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: operator, appId, or email" }),
      };
    }

    // Retrieve app secret
    const secretRef = secretsCol.doc(appId);
    const secretDoc = await secretRef.get();

    if (!secretDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `No secret found for appId: ${appId}` }),
      };
    }

    const appSecret = secretDoc.data().root;

    // Initialize per-app Firebase app dynamically
    if (!admin.apps.some(app => app.name === "app")) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(appSecret))
      }, "app");
    }

    const db = admin.app("app").firestore();

    let result;
    switch (operator.toLowerCase()) {
      case "register":
        if (!password) {
          throw new Error("Password is required for user registration");
        }
        result = await admin.app("app").auth().createUser({ email, password });
        payload.status = "active";
        payload.createdAt = new Date();
        await db.collection("users").doc(payload.username).set(payload);
        break;

      case "delete":
        await admin.app("app").auth().deleteUserByEmail(email)
          .catch(err => { throw new Error(err.message) });
        await db.collection("users").doc(payload.username).update({ status: "deleted", deletedAt: new Date() });
        result = { message: `User ${email} deleted` };
        break;

      case "disable":
        //await admin.app("app").auth().updateUserByEmail(email, { disabled: true });
       // Get user by email
       const userRecord = await admin.auth().getUserByEmail(email);
    
    // Disable the user
        await admin.auth().updateUser(userRecord.uid, { disabled: true });
        await db.collection("users").doc(payload.username).update({ status: "disabled", updatedAt: new Date() });
        result = { message: `User ${email} disabled` };
        break;

      case "enable":
       // await admin.app("app").auth().updateUserByEmail(email, { disabled: false });
       // Get user by email
       const userRecord = await admin.auth().getUserByEmail(email);
    
    // Disable the user
       await admin.auth().updateUser(userRecord.uid, { disabled: false });
        
        await db.collection("users").doc(payload.username).update({ status: "active", updatedAt: new Date() });
        result = { message: `User ${email} enabled` };
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid operator. Must be one of: register, delete, disable, enable" }),
        };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: result }),
    };

  } catch (error) {
    console.error("Error handling webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

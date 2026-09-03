const admin = require("firebase-admin");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Method Not Allowed"
      })
    };
  }

  let app;

  try {
    const headers = event.headers || {};

    // Headers are case-insensitive, but Netlify may normalize them.
    const encodedKey =
      headers["x-firebase-service-account"] ||
      headers["X-Firebase-Service-Account"];

    const collection =
      headers["x-firebase-collection"] ||
      headers["X-Firebase-Collection"];

    const docID =
      headers["x-firebase-doc-id"] ||
      headers["X-Firebase-Doc-ID"];

    if (!encodedKey) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Missing Firebase service account"
        })
      };
    }

    if (!collection || !docID) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing collection or document ID"
        })
      };
    }

    // Decode service-account JSON
    const serviceAccount = JSON.parse(
      Buffer.from(encodedKey, "base64").toString("utf8")
    );

    // Create a Firebase Admin app for this request
    app = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount)
      },
      `request-${Date.now()}-${Math.random()}`
    );

    const db = admin.firestore(app);

    const snapshot = await db
      .collection(collection)
      .doc(docID)
      .get();

    if (!snapshot.exists) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Document not found"
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        data: snapshot.data()
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Failed to retrieve document"
      })
    };

  } finally {
    if (app) {
      try {
        await app.delete();
      } catch (e) {
        console.error("Failed to delete Firebase app:", e);
      }
    }
  }
};

import fetch from "node-fetch";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SIB_CONFIG)),
  });
}

const db = admin.firestore();

export async function handler(event) {
  try {
    const { reference, schoolId } = event.queryStringParameters || {};

    if (!reference || !schoolId) {
      return {
        statusCode: 400,
        body: "Missing reference or schoolId",
      };
    }

    // Verify transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PS_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return {
        statusCode: 400,
        body: "Transaction verification failed.",
      };
    }

    const amount = verifyData.data.amount / 100;

    // Use Firestore transaction for atomic update
    const schoolRef = db.collection(schoolId).doc("account");
    await db.runTransaction(async (t) => {
      const doc = await t.get(schoolRef);
      const prev = doc.exists ? doc.data().balance || 0 : 0;
      t.set(schoolRef, { balance: prev + amount }, { merge: true });
    });

    // Redirect user to frontend success page
    return {
      statusCode: 302,
      headers: {
        Location: `https://${schoolId}.mainafly.com/payment-success?ref=${reference}&schoolId=${schoolId}`,
      },
    };
  } catch (error) {
    console.error("Callback error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error: " + error.message,
    };
  }
}

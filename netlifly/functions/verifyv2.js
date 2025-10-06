import fetch from "node-fetch";
import admin from "firebase-admin";

// --- Initialize Firebase only once ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SIB_CONFIG))
  });
}

const db = admin.firestore();

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { reference, schoolId } = JSON.parse(event.body || "{}");

    if (!reference || !schoolId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing reference or schoolId" }),
      };
    }

    // --- Verify transaction with Paystack ---
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Transaction verification failed" }),
      };
    }

    const amount = verifyData.data.amount / 100; // Convert from kobo to Naira

    // --- Firestore Transaction to prevent race conditions ---
    const schoolRef = db.collection(schoolId).doc("account");

    const newBalance = await db.runTransaction(async (t) => {
      const doc = await t.get(schoolRef);
      const prevBalance = doc.exists ? doc.data().balance || 0 : 0;
      const updatedBalance = prevBalance + amount;

      t.set(schoolRef, { balance: updatedBalance }, { merge: true });
      return updatedBalance;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Payment verified and balance updated successfully.",
        schoolId,
        amount,
        newBalance,
        reference,
      }),
    };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

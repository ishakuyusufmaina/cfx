const fetch = require("node-fetch");
const admin = require("firebase-admin");

// Initialize Firebase once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SIB_CONFIG)),
  });
}

const db = admin.firestore();

exports.handler = async function (event) {
  try {
    const { reference, schoolId } = event.queryStringParameters || {};

    if (!reference || !schoolId) {
      return {
        statusCode: 400,
        body: "Missing reference or schoolId",
      };
    }

    // Verify payment with Paystack
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

    // Firestore Transaction (atomic balance update)
    const schoolRef = db.collection(schoolId).doc("account");
    await db.runTransaction(async (t) => {
      const doc = await t.get(schoolRef);
      const prevBalance = doc.exists ? doc.data().balance || 0 : 0;
      t.set(schoolRef, { balance: prevBalance + amount }, { merge: true });
    });

    // Redirect back to frontend success page
    return {
      statusCode: 302,
      headers: {
        Location: `https://${schoolId}.mainafly.com/admin/bill.html?ref=${reference}&schoolId=${schoolId}`,
      },
    };
  } catch (error) {
    console.error("Callback error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error: " + error.message,
    };
  }
};

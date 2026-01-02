const crypto = require("crypto");
const unityAdmin = require("firebase-admin");
//const admin = require("firebase-admin");

// Initialize Unity Firebase once
if (!unityAdmin.apps.length) {
  unityAdmin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.UNITY_CONFIG)),
  });
}

const udb = unityAdmin.firestore();
const secretsCol = udb.collection("secrets");
// Initialize Firebase once
/*if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SIB_CONFIG)),
  });
}*/

exports.handler = async (event) => {
  try {
    // Paystack sends POST requests
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const paystackSignature = event.headers["x-paystack-signature"];
    const secret = process.env.MSS_PS;

    // Verify signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(event.body)
      .digest("hex");

    if (hash !== paystackSignature) {
      return { statusCode: 401, body: "Invalid signature" };
    }

    const payload = JSON.parse(event.body);
    const { event: eventType, data } = payload;
    const meta = data.metadata;
    
    // Handle events
    switch (eventType) {
      case "dedicatedaccount.assign.success":
        const dva = data.dedicated_account;
        const schoolAdmin = require("firebase-admin");
        const schoolSecret = await secretsCol
          .doc(meta.schoolBatch)
          .get().data().root;
        if (!schoolAdmin.apps.length){
          schoolAdmin.initializeApp({
            credential: JSON.parse(schoolSecret)
          })
        }
        const schoolDb = schoolAdmin.firestore();
        const stdRef = schoolDb
          .collection(meta.schoolId)
          .doc("db")
          .collection("students")
          .doc(meta.studentId);
        await stdRef.update({
          account: {
            accountNumber: dva.account_number,
            accountName: dva.account_name,
            bankName: dva.bank.name,
            id: dva.id,
            createdAt: dva.created_at,
            updatedAt: dva.updated_at            
          }
        });
        break;
      
      case "charge.success":
        console.log("Payment successful:", data.reference, JSON.stringify(data));
        // TODO: update DB, activate subscription, etc.
        const payment = {
          "class": meta.class,
          timestamp: unityAdmin.firestore.Timestamp.fromDate(
             new Date(data.paid_at)
          ),
          reference: data.reference,
          "for": meta.for,
          term: meta.term,
          session: meta.session,
          amount: Number(data.amount),
          schoolId: meta.schoolId,
          studentId: meta.studentId,
          studentName: meta.studentName
          
        }
        const pbSecretRef = secretsCol.doc("paymentbook");
        const pbSecretDoc = await pbSecretRef.get();
        const pbSecret = pbSecretDoc.data().root;
        const pbAdmin = require("firebase-admin");
        if (!pbAdmin.apps.length) {
          pbAdmin.initializeApp({
            credential: JSON.parse(pbSecret)
          });
        }
        const pbdb = pbAdmin.firetore();
        await pbdb.collection("payments").add(payment);
        break;

      case "transfer.success":
        console.log("Transfer successful:", data.id);
        break;

      default:
        console.log("Unhandled event:", eventType);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error("Webhook error:", error);
    return { statusCode: 500, body: "Server Error" };
  }
};

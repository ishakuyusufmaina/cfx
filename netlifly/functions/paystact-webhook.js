const crypto = require("crypto");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "maiduguriinnovativeschool2025@gmail.com", //process.env.EMAIL_USER,
    pass: process.env.mailpass, // Gmail App Password
  },
});
//const admin = require("firebase-admin");


function paymentEmailTemplate(payment) {
  const date = payment.timestamp.toDate();
  const formattedDate = date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    subject: `Payment Receipt – ${payment.studentName}`,
    html: `
      <div style="font-family:Arial; max-width:600px">
        <h2>Payment Receipt</h2>
        <p><strong>Student:</strong> ${payment.studentName}</p>
        <p><strong>Class:</strong> ${payment.class}</p>
        <p><strong>Term:</strong> ${payment.term}</p>
        <p><strong>Session:</strong> ${payment.session}</p>
        <p><strong>Purpose:</strong> ${payment.for}</p>
        <hr/>
        <h3>Amount Paid: ₦${payment.amount.toLocaleString()}</h3>
        <p><strong>Reference:</strong> ${payment.reference}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <hr/>
        <p>Thank you for your payment.</p>
      </div>
    `,
    text: `
Payment Receipt
Student: ${payment.studentName}
Amount: ₦${payment.amount}
Reference: ${payment.reference}
Date: ${formattedDate}
`
  };
}


async function sendPaymentEmail(payment, email) {
  const mail = paymentEmailTemplate(payment);

  await mailer.sendMail({
    from: `"School Admin maiduguriinnovativeschool2025@gmail.com",
    to: email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

// Initialize Unity Firebase once
if (!admin.apps.some(app=>app.name=="unity")) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.UNITY_CONFIG)),
  }, "unity");
}

const udb = admin.app("unity").firestore();
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
    const meta = data.customer.metadata;
    
    // Handle events
    switch (eventType) {
      case "dedicatedaccount.assign.success":
        const dva = data.dedicated_account;
       // const schoolAdmin = require("firebase-admin");
        const schoolSecretRef = secretsCol.doc(meta.schoolBatch);
        const schoolSecretDoc = await schoolSecretRef.get();
       const schoolSecret = schoolSecretDoc.data().root;
        if (!admin.apps.some(app=>app.name=="school")){
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(schoolSecret))
          }, "school")
        }
        const schoolDb = admin.app("school").firestore();
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
     //   console.log("Payment successful:", data.reference, JSON.stringify(data));
        // TODO: update DB, activate subscription, etc.
        const payment = {
          "class": meta.class,
          timestamp: admin.firestore.Timestamp.fromDate(
             new Date(data.paid_at)
          ),
          reference: data.reference,
          "for": meta.for,
          term: meta.term,
          session: meta.session,
          amount: Number(data.amount)/100,
          schoolId: meta.schoolId,
          studentId: meta.studentId,
          studentName: meta.studentName
          
        }
        const pbSecretRef = secretsCol.doc("paymentbook");
        const pbSecretDoc = await pbSecretRef.get();
        const pbSecret = pbSecretDoc.data().root;
        const pbAdmin = require("firebase-admin");
        if (!admin.apps.some(app=>app.name=="paybook")) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(pbSecret))
          }, "paybook");
        }
        const pbdb = admin.app("paybook").firestore();
        await pbdb.collection("payments").add(payment);


          if (true) {
    sendPaymentEmail(payment, "yusufmainaishaku@gmail.com")
      .catch(err => console.error("Email failed:", err));
          }
        
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

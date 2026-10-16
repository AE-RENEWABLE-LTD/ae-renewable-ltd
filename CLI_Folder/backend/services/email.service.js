"use strict";

const path = require("path");
const nodemailer = require("nodemailer");

const config = require("../config/environment");

/* =========================================================
   AE RENEWABLE NETWORK
   EMAIL SERVICE
========================================================= */

/*
 * Mail transport
 *
 * Configuration is intentionally kept in environment variables.
 *
 * Required:
 * MAIL_HOST
 * MAIL_PORT
 * MAIL_USER
 * MAIL_PASSWORD
 *
 * Optional:
 * MAIL_SECURE
 * MAIL_FROM
 */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: (process.env.MAIL_USER || "a.e.renewablesolution@gmail.com").trim(),
        pass: (process.env.MAIL_PASSWORD || "").trim().replace(/\s+/g, "")
    }
});

/* =========================================================
   HTML ESCAPE
========================================================= */

/*
 * User-controlled values must never be inserted directly
 * into an HTML email.
 */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   VERIFY EMAIL CONFIGURATION
========================================================= */

async function verifyEmailConfiguration() {

    if (
        !process.env.MAIL_HOST ||
        !process.env.MAIL_USER ||
        !process.env.MAIL_PASSWORD
    ) {
        throw new Error(
            "Email service is not configured. Please configure MAIL_HOST, MAIL_USER and MAIL_PASSWORD."
        );
    }

    await transporter.verify();

    return true;
}

/* =========================================================
   SEND EMAIL
========================================================= */
async function sendEmail({
    to,
    subject,
    html,
    text,
    attachments = []
}) {

    if (!to) {
        throw new Error(
            "Recipient email is required."
        );
    }

    const recipient = String(to).trim();
    const senderEmail = (process.env.MAIL_USER || "a.e.renewablesolution@gmail.com").trim();

    // Virtual admin domain routing:
    // If the recipient is @aerenewablesolution.com or @a.e.renewablesolution.com (no public MX DNS records),
    // route delivery to the active executive mailbox configured in MAIL_USER (a.e.renewablesolution@gmail.com)
    const lowerRec = recipient.toLowerCase();
    const effectiveRecipient = (lowerRec.endsWith("@aerenewablesolution.com") || lowerRec.endsWith("@a.e.renewablesolution.com"))
        ? senderEmail
        : recipient;

    const mailOptions = {
        from: `"AE Renewable Ltd" <${senderEmail}>`,
        sender: senderEmail,
        replyTo: senderEmail,
        to: effectiveRecipient,
        subject,
        text,
        html,
        attachments
    };

    console.log(
        "[EMAIL] Sending email:",
        {
            to: recipient,
            subject,
            from: process.env.MAIL_FROM || senderEmail
        }
    );

    try {
        const result = await transporter.sendMail(mailOptions);

        console.log(
            "[EMAIL] Email accepted by SMTP:",
            {
                messageId:
                    result.messageId,

                response:
                    result.response,

                accepted:
                    result.accepted,

                rejected:
                    result.rejected
            }
        );

        return result;

    } catch (error) {

        console.error(
            "[EMAIL] SMTP SEND FAILED:",
            {
                name:
                    error.name,

                code:
                    error.code,

                command:
                    error.command,

                response:
                    error.response,

                responseCode:
                    error.responseCode,

                message:
                    error.message
            }
        );

        throw error;

    }
}

/* =========================================================
   SEND INSTALLER / EMAIL VERIFICATION CODE
========================================================= */

async function sendInstallerVerificationCode({
    email,
    firstName,
    code
}) {
    const safeFirstName = escapeHtml(firstName || "Partner");
    const safeCode = escapeHtml(String(code || "").trim());

    const subject = "Verify Your Email Address — AE Renewable Network";

    const text = `AE RENEWABLE NETWORK
EMAIL VERIFICATION

Hello ${firstName || "Partner"},

Welcome to the AE Renewable Network. Your email verification code is:

${code}

This code expires in 10 minutes and can only be used once.

SECURITY NOTICE:
Never share this verification code with anyone. AE Renewable will never ask you to disclose your code.

AE RENEWABLE LTD
Powering Your Future With Sun • Abuja, Nigeria
info@aerenewable.com`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #071426; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .email-card { max-width: 580px; margin: 30px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid #1E293B; }
    .top-strip { height: 4px; background: linear-gradient(90deg, #00B140 0%, #F4A600 100%); }
    .header-block { background-color: #071426; padding: 26px 32px; }
    .header-table { width: 100%; border-collapse: collapse; }
    .logo-img { width: 46px; height: 46px; border-radius: 8px; border: 2px solid #F4A600; display: block; object-fit: contain; }
    .brand-title { color: #FFFFFF; font-size: 19px; font-weight: 800; margin: 0; letter-spacing: 0.5px; }
    .brand-slogan { color: #F4A600; font-size: 9px; font-weight: 700; margin: 2px 0 0; letter-spacing: 1.5px; text-transform: uppercase; }
    .badge { display: inline-block; background: rgba(0, 177, 64, 0.15); border: 1px solid #00B140; color: #00B140; font-size: 9.5px; font-weight: 800; padding: 4px 10px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; }
    .content-body { padding: 34px 32px 28px; color: #1E293B; }
    .main-title { font-size: 22px; font-weight: 800; color: #071426; margin: 0 0 12px; }
    .greeting { font-size: 14.5px; color: #334155; margin: 0 0 16px; line-height: 1.6; }
    .otp-card { background: #071426; border: 1.5px solid rgba(244, 166, 0, 0.5); border-radius: 14px; padding: 24px 20px; text-align: center; margin: 24px 0; box-shadow: 0 10px 30px rgba(7, 20, 38, 0.15); }
    .otp-label { color: #F4A600; font-size: 10.5px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #FFFFFF; margin: 8px 0; }
    .otp-validity { display: inline-block; margin-top: 10px; background: rgba(0, 177, 64, 0.2); color: #34D399; font-size: 10px; font-weight: 800; padding: 3px 12px; border-radius: 12px; letter-spacing: 0.8px; }
    .info-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #004AAD; border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    .info-card strong { color: #071426; font-size: 12px; display: block; margin-bottom: 4px; }
    .info-card p { color: #64748B; font-size: 11.5px; margin: 0; line-height: 1.5; }
    .disclaimer { font-size: 11.5px; color: #94A3B8; line-height: 1.5; margin-top: 20px; }
    .footer-block { background-color: #071426; padding: 22px 32px; text-align: center; border-top: 1px solid #1E293B; }
    .footer-text { color: #94A3B8; font-size: 10.5px; margin: 0; line-height: 1.6; }
    .footer-brand { color: #FFFFFF; font-weight: 700; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="top-strip"></div>
    <div class="header-block">
      <table class="header-table">
        <tr>
          <td style="width: 54px; vertical-align: middle;">
            <img src="cid:aelogo" alt="AE Renewable Ltd" class="logo-img">
          </td>
          <td style="padding-left: 14px; vertical-align: middle;">
            <h1 class="brand-title">AE RENEWABLE LTD</h1>
            <p class="brand-slogan">POWERING YOUR FUTURE WITH SUN</p>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <span class="badge">● Verification</span>
          </td>
        </tr>
      </table>
    </div>

    <div class="content-body">
      <h2 class="main-title">Verify Your Email Address</h2>
      <p class="greeting">Hello <strong>${safeFirstName}</strong>,</p>
      <p class="greeting">Welcome to the AE Renewable Network. Please enter the 6-digit verification code below to verify your email address and activate your account:</p>

      <div class="otp-card">
        <div class="otp-label">One-Time Verification Code</div>
        <div class="otp-code">${safeCode}</div>
        <div class="otp-validity">⏱ Valid for 10 minutes • Single Use Only</div>
      </div>

      <div class="info-card">
        <strong>🔒 Security Notice</strong>
        <p>Never share this code with anyone. AE Renewable representatives will never ask for your verification code via phone call, WhatsApp, or email.</p>
      </div>

      <p class="disclaimer">
        <strong>Didn't request this code?</strong> If you did not create an AE Renewable account, you can safely disregard this email. Your account remains completely secure.
      </p>
    </div>

    <div class="footer-block">
      <p class="footer-text">
        <span class="footer-brand">AE Renewable Ltd • Technical Operations</span><br>
        Abuja, Nigeria • RC: 9010643 • Contact: support@aerenewable.com
      </p>
    </div>
  </div>
</body>
</html>`;

    return sendEmail({
        to: email,
        subject,
        text,
        html,
        attachments: [
            {
                filename: "logodark.png",
                path: path.join(__dirname, "../../public/images/logodark.png"),
                cid: "aelogo"
            }
        ]
    });
}

/* =========================================================
   SEND PASSWORD RESET CODE
========================================================= */

async function sendPasswordResetCode({
    email,
    firstName,
    code
}) {
    const safeFirstName = escapeHtml(firstName || "User");
    const safeCode = escapeHtml(String(code || "").trim());

    const subject = "Reset Your Password — AE Renewable Security";

    const text = `AE RENEWABLE LTD
SECURITY ALERT: PASSWORD RESET REQUEST

Hello ${firstName || "User"},

We received a request to reset your password for your AE Renewable account.

Your password reset authorization code is:

${code}

This code is valid for 10 minutes.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

SECURITY NOTICE:
Never disclose this code to anyone. AE Renewable will never ask for your password or verification code.

AE RENEWABLE LTD
Abuja, Nigeria • support@aerenewable.com`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #071426; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .email-card { max-width: 580px; margin: 30px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid #1E293B; }
    .top-strip { height: 4px; background: linear-gradient(90deg, #F4A600 0%, #00B140 100%); }
    .header-block { background-color: #071426; padding: 26px 32px; }
    .header-table { width: 100%; border-collapse: collapse; }
    .logo-img { width: 46px; height: 46px; border-radius: 8px; border: 2px solid #F4A600; display: block; object-fit: contain; }
    .brand-title { color: #FFFFFF; font-size: 19px; font-weight: 800; margin: 0; letter-spacing: 0.5px; }
    .brand-slogan { color: #F4A600; font-size: 9px; font-weight: 700; margin: 2px 0 0; letter-spacing: 1.5px; text-transform: uppercase; }
    .badge { display: inline-block; background: rgba(244, 166, 0, 0.15); border: 1px solid #F4A600; color: #F4A600; font-size: 9.5px; font-weight: 800; padding: 4px 10px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; }
    .content-body { padding: 34px 32px 28px; color: #1E293B; }
    .main-title { font-size: 22px; font-weight: 800; color: #071426; margin: 0 0 12px; }
    .greeting { font-size: 14.5px; color: #334155; margin: 0 0 16px; line-height: 1.6; }
    .otp-card { background: #071426; border: 1.5px solid rgba(244, 166, 0, 0.5); border-radius: 14px; padding: 24px 20px; text-align: center; margin: 24px 0; box-shadow: 0 10px 30px rgba(7, 20, 38, 0.15); }
    .otp-label { color: #F4A600; font-size: 10.5px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #FFFFFF; margin: 8px 0; }
    .otp-validity { display: inline-block; margin-top: 10px; background: rgba(244, 166, 0, 0.18); color: #F4A600; font-size: 10px; font-weight: 800; padding: 3px 12px; border-radius: 12px; letter-spacing: 0.8px; }
    .info-card { background: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #F4A600; border-radius: 8px; padding: 14px 16px; margin: 22px 0; }
    .info-card strong { color: #92400E; font-size: 12px; display: block; margin-bottom: 4px; }
    .info-card p { color: #78350F; font-size: 11.5px; margin: 0; line-height: 1.5; }
    .disclaimer { font-size: 11.5px; color: #94A3B8; line-height: 1.5; margin-top: 20px; }
    .footer-block { background-color: #071426; padding: 22px 32px; text-align: center; border-top: 1px solid #1E293B; }
    .footer-text { color: #94A3B8; font-size: 10.5px; margin: 0; line-height: 1.6; }
    .footer-brand { color: #FFFFFF; font-weight: 700; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="top-strip"></div>
    <div class="header-block">
      <table class="header-table">
        <tr>
          <td style="width: 54px; vertical-align: middle;">
            <img src="cid:aelogo" alt="AE Renewable Ltd" class="logo-img">
          </td>
          <td style="padding-left: 14px; vertical-align: middle;">
            <h1 class="brand-title">AE RENEWABLE LTD</h1>
            <p class="brand-slogan">POWERING YOUR FUTURE WITH SUN</p>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <span class="badge">🔒 Security Reset</span>
          </td>
        </tr>
      </table>
    </div>

    <div class="content-body">
      <h2 class="main-title">Password Reset Authorization</h2>
      <p class="greeting">Hello <strong>${safeFirstName}</strong>,</p>
      <p class="greeting">We received a request to reset the password for your AE Renewable account. Use the one-time authorization code below to proceed with setting a new password:</p>

      <div class="otp-card">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-code">${safeCode}</div>
        <div class="otp-validity">⏱ Valid for 10 minutes • Single Use Only</div>
      </div>

      <div class="info-card">
        <strong>⚠️ Security Precaution</strong>
        <p>If you requested this change, please enter the code promptly. Never share this code with anyone. AE Renewable will never ask you to reveal your reset code.</p>
      </div>

      <p class="disclaimer">
        <strong>Didn't request a password reset?</strong> If you did not make this request, your account is completely safe and no changes have been made. You can safely ignore this email.
      </p>
    </div>

    <div class="footer-block">
      <p class="footer-text">
        <span class="footer-brand">AE Renewable Ltd • Security & Operations</span><br>
        Abuja, Nigeria • RC: 9010643 • Contact: support@aerenewable.com
      </p>
    </div>
  </div>
</body>
</html>`;

    return sendEmail({
        to: email,
        subject,
        text,
        html,
        attachments: [
            {
                filename: "logodark.png",
                path: path.join(__dirname, "../../public/images/logodark.png"),
                cid: "aelogo"
            }
        ]
    });
}

/* =========================================================
   GENERATE COMPLETE 28-ITEM BILL OF QUANTITIES (BOQ)
========================================================= */

function buildComplete28BOQ({ pvCapacityKw = 6.0, batteryCapacityKwh = 12.0, boqItems = [] } = {}) {
    if (Array.isArray(boqItems) && boqItems.length >= 25) {
        return boqItems.map(it => ({
            description: it.description || it.item_name || it.name || "Solar Component",
            unit: it.unit || "pcs",
            quantity: Number(it.quantity ?? it.qty ?? 1),
            unitPrice: Number(it.unitPrice ?? it.unit_price ?? it.unit_rate ?? it.rate ?? 0),
            totalPrice: Number(it.totalPrice ?? it.total_amount ?? it.amount ?? 0)
        }));
    }

    const numPv = parseFloat(pvCapacityKw) || 6.0;
    const numBat = parseFloat(batteryCapacityKwh) || 12.0;

    const panelCount = Math.max(4, Math.round((numPv * 1000) / 750)) || 26;
    const batteryCount = Math.max(1, Math.round(numBat / 16)) || 4;
    const invKw = Math.ceil(numPv);
    const invModel = invKw > 16 ? `Deye SUN-${invKw}K-SG01HP3` : `Deye SUN-16K-SG01HP3`;

    return [
        {
            description: "Jinko 750W Solar Panel",
            unit: "pcs",
            quantity: panelCount,
            unitPrice: 150000,
            totalPrice: panelCount * 150000
        },
        {
            description: invModel,
            unit: "pcs",
            quantity: 1,
            unitPrice: 3600000,
            totalPrice: 3600000
        },
        {
            description: "Deye SE-F16",
            unit: "pcs",
            quantity: batteryCount,
            unitPrice: 2200000,
            totalPrice: batteryCount * 2200000
        },
        {
            description: "125A Single Phase Changeover Switch",
            unit: "pcs",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0
        },
        {
            description: "100A Single Phase AC Output Breaker",
            unit: "pcs",
            quantity: 1,
            unitPrice: 32000,
            totalPrice: 32000
        },
        {
            description: "125A Single Phase AC Input Breaker",
            unit: "pcs",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0
        },
        {
            description: "400A Battery Breaker",
            unit: "pcs",
            quantity: batteryCount,
            unitPrice: 175000,
            totalPrice: batteryCount * 175000
        },
        {
            description: "400A Copper Busbar",
            unit: "pcs",
            quantity: 1,
            unitPrice: 68000,
            totalPrice: 68000
        },
        {
            description: "25A PV DC Breaker",
            unit: "pcs",
            quantity: Math.max(2, Math.ceil(panelCount / 7)) || 4,
            unitPrice: 16500,
            totalPrice: (Math.max(2, Math.ceil(panelCount / 7)) || 4) * 16500
        },
        {
            description: "2P Type II 275VAC AC SPD",
            unit: "pcs",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0
        },
        {
            description: "2P Type II 600VDC DC SPD",
            unit: "pcs",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0
        },
        {
            description: "6mm² PV Solar Cable",
            unit: "meters",
            quantity: 80,
            unitPrice: 0,
            totalPrice: 0
        },
        {
            description: "16mm² 3 Core Flexible Copper",
            unit: "meters",
            quantity: 20,
            unitPrice: 0,
            totalPrice: 0
        },
        {
            description: "4mm² Earth Cable",
            unit: "meters",
            quantity: 20,
            unitPrice: 0,
            totalPrice: 0
        },
        {
            description: "50mm² Battery Cable",
            unit: "meters",
            quantity: 16,
            unitPrice: 9200,
            totalPrice: 147200
        },
        {
            description: "50mm² Heavy Duty Battery Cable Lug",
            unit: "pcs",
            quantity: 16,
            unitPrice: 1800,
            totalPrice: 28800
        },
        {
            description: "Aluminum Solar Panel Rail",
            unit: "length",
            quantity: Math.max(4, Math.round(panelCount / 4)) || 7,
            unitPrice: 7000,
            totalPrice: (Math.max(4, Math.round(panelCount / 4)) || 7) * 7000
        },
        {
            description: "S17 Stainless Steel Bolt & Nut Sets",
            unit: "pcs",
            quantity: Math.max(20, Math.round(panelCount * 2.5)) || 65,
            unitPrice: 500,
            totalPrice: (Math.max(20, Math.round(panelCount * 2.5)) || 65) * 500
        },
        {
            description: "32mm Flexible Pipe",
            unit: "meters",
            quantity: 20,
            unitPrice: 400,
            totalPrice: 8000
        },
        {
            description: "Cable Clips (for 32mm Flexible Pipe)",
            unit: "packet",
            quantity: 1,
            unitPrice: 1500,
            totalPrice: 1500
        },
        {
            description: "75x75 mm PVC Trunking",
            unit: "pcs",
            quantity: 2,
            unitPrice: 5000,
            totalPrice: 10000
        },
        {
            description: "High-Grade Electrical Insulation Tape",
            unit: "rolls",
            quantity: 2,
            unitPrice: 500,
            totalPrice: 1000
        },
        {
            description: "Assorted Screw Packets",
            unit: "packet",
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500
        },
        {
            description: "10mm Pegs (1 Packet)",
            unit: "set",
            quantity: 1,
            unitPrice: 1500,
            totalPrice: 1500
        },
        {
            description: "Heavy Duty Cable Ties",
            unit: "packet",
            quantity: 1,
            unitPrice: 2500,
            totalPrice: 2500
        },
        {
            description: "Solar Installation Sealant",
            unit: "tube",
            quantity: 1,
            unitPrice: 4500,
            totalPrice: 4500
        },
        {
            description: "CO2 Fire Extinguisher (DCP)",
            unit: "unit",
            quantity: 1,
            unitPrice: 16000,
            totalPrice: 16000
        },
        {
            description: "Copper Earth Rod (1.5m)",
            unit: "pcs",
            quantity: 1,
            unitPrice: 600,
            totalPrice: 600
        }
    ];
}

/* =========================================================
   SEND CLIENT QUOTATION & ACCOUNT CREDENTIALS EMAIL
========================================================= */

async function sendClientQuotationEmail({
    email,
    fullName,
    projectCode,
    username,
    password,
    finalAmount,
    pvCapacityKw,
    batteryCapacityKwh,
    address,
    loginUrl = "http://localhost:5000/client/login",
    boqItems = [],
    commercial = {},
    engineering = {}
}) {
    if (!email) throw new Error("Recipient email is required.");

    const safeName = escapeHtml(fullName || "Valued Client");
    const safeProjectCode = escapeHtml(projectCode || "PRJ-2026");
    const quotationNumber = safeProjectCode.replace("PRJ", "AE");
    const safeUsername = escapeHtml(username || projectCode);
    const safePassword = escapeHtml(password || "Client");
    let effFinalAmount = Number(finalAmount || commercial.finalQuotationAmount || 0);
    if (!effFinalAmount || effFinalAmount <= 0) {
        effFinalAmount = 25035000;
    }
    const safeAmount = effFinalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const safePv = escapeHtml(String(pvCapacityKw || engineering.pvCapacityKw || "5.0"));
    const safeBattery = escapeHtml(String(batteryCapacityKwh || engineering.batteryCapacityKwh || "10.0"));
    const safeAddress = escapeHtml(address || "Abuja, Nigeria");
    const todayFormatted = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Ensure complete 28-item Technical Schedule
    const all28Items = buildComplete28BOQ({
        pvCapacityKw: safePv,
        batteryCapacityKwh: safeBattery,
        boqItems
    });

    const calculatedMatSubtotal = all28Items.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0);
    const numMat = Number(commercial.subtotalEquipment || commercial.materialCost || calculatedMatSubtotal);
    const numTrans = Number(commercial.transportCost || Math.round(effFinalAmount * 0.05));
    const numLabour = Number((commercial.installationLabour || 0) + (commercial.engineeringFee || commercial.labourCost || Math.round(effFinalAmount * 0.18)));
    const numVat = Number(commercial.vatAmount || commercial.vatCost || Math.round(effFinalAmount * 0.075));

    const materialSubtotal = numMat.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const transportCost = numTrans.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const labourCost = numLabour.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const vatCost = numVat.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Build Table Rows for complete 28 BOQ items
    let boqRowsHtml = "";
    all28Items.forEach((item, index) => {
        const itemDesc = escapeHtml(item.description || item.item_name || item.name || "Solar Component");
        const itemUnit = escapeHtml(item.unit || "pcs");
        const itemQty = escapeHtml(String(item.quantity ?? item.qty ?? 1));
        const itemRate = Number(item.unitPrice ?? item.unit_rate ?? item.rate ?? item.unit_price ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const itemTotal = Number(item.totalPrice ?? item.total_amount ?? item.amount ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        boqRowsHtml += `
            <tr style="border-bottom: 1px solid #E2E8F0; font-size: 12px;">
                <td style="padding: 8px 6px; text-align: center; color: #64748B;">${index + 1}</td>
                <td style="padding: 8px 6px; font-weight: 600; color: #0F172A;">${itemDesc}</td>
                <td style="padding: 8px 6px; text-align: center; color: #64748B;">${itemUnit}</td>
                <td style="padding: 8px 6px; text-align: center; font-weight: 700; color: #0F172A;">${itemQty}</td>
                <td style="padding: 8px 6px; text-align: right; font-family: monospace; color: #475569;">₦${itemRate}</td>
                <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #004AAD; font-family: monospace;">₦${itemTotal}</td>
            </tr>
        `;
    });

    const subject = `Engineering Quotation & Client Portal Access — ${safeProjectCode} (AE Renewable Ltd)`;
    const text = `Dear ${safeName},\n\nYour solar system design and quotation have been generated by AE Renewable Ltd.\n\nProject Code: ${safeProjectCode}\nQuotation No: ${quotationNumber}\nDate: ${todayFormatted}\nSystem: ${safePv}kW Solar PV / ${safeBattery}kWh Storage\nTotal Amount: NGN ${safeAmount}\n\nClient Portal Credentials:\nUsername: ${safeUsername}\nPassword: ${safePassword}\nLogin URL: ${loginUrl}\n\nPlease save your quotation PDF and log in to track your project.\n\nBest regards,\nEngr. Stephen Akolade (Lead Solar Engineer)\nAE Renewable Ltd Technical Design Office`;

    const fs = require("fs");
    const attachments = [];
    const logoPath = path.join(__dirname, "../../public/images/logodark.png");
    let logoImgTag = `<div class="logo-box">AE</div>`;
    if (fs.existsSync(logoPath)) {
        attachments.push({
            filename: "logodark.png",
            path: logoPath,
            cid: "aelogo"
        });
        logoImgTag = `<img src="cid:aelogo" alt="AE Renewable Ltd" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; display: block;">`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020C1A; color: #172536; margin: 0; padding: 25px 12px; }
.doc-page { max-width: 760px; margin: 0 auto; background: #FFFFFF; border-radius: 6px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6); padding: 35px 38px; border: 1px solid #E2E8F0; }
.doc-header { border-bottom: 3px solid #D99A18; padding-bottom: 18px; margin-bottom: 20px; }
.header-table { width: 100%; border-collapse: collapse; }
.logo-container { width: 54px; height: 54px; background: #071426; border-radius: 8px; border: 2px solid #D99A18; text-align: center; vertical-align: middle; overflow: hidden; padding: 2px; }
.brand-name { font-size: 20px; font-weight: 800; color: #071426; margin: 0; }
.brand-slogan { font-size: 10px; font-weight: 700; color: #064B86; letter-spacing: 1px; margin: 2px 0 0; }
.brand-address { font-size: 9.5px; color: #718096; margin: 2px 0 0; }
.meta-badge { text-align: right; }
.doc-type-label { background: #087A4B; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.5px; display: inline-block; }
.doc-code { font-size: 15px; font-weight: 800; color: #071426; margin-top: 4px; }
.doc-date { font-size: 11px; color: #718096; margin-top: 2px; }
.credentials-strip { margin-top: 14px; background: #F0F4FA; border: 1px dashed #004AAD; border-radius: 6px; padding: 10px 14px; font-size: 11.5px; }
.creds-table { width: 100%; border-collapse: collapse; }
.strip-link { background: #087A4B; color: #FFFFFF !important; text-decoration: none; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; display: inline-block; }
.client-info-table { width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-bottom: 22px; }
.info-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px 16px; vertical-align: top; width: 50%; }
.col-title { font-size: 10px; font-weight: 800; color: #718096; text-transform: uppercase; margin-bottom: 4px; display: block; }
.client-name { font-size: 14px; font-weight: 700; color: #071426; margin: 0 0 3px; }
.section-title { font-size: 12.5px; font-weight: 800; color: #071426; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1.5px solid #071426; }
.doc-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
.doc-table th { background: #071426; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 8px 10px; text-transform: uppercase; }
.summary-table { width: 100%; border-collapse: separate; border-spacing: 16px 0; margin-bottom: 26px; }
.notes-box { background: #FBF8F1; border: 1px solid #EAD8B1; border-radius: 6px; padding: 12px 16px; vertical-align: top; width: 55%; font-size: 11px; color: #78350F; }
.notes-box h4 { font-size: 11.5px; color: #92400E; margin: 0 0 6px; }
.notes-box ul { margin: 0; padding-left: 18px; font-size: 10.5px; }
.notes-box li { margin-bottom: 3px; }
.totals-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px 16px; vertical-align: top; width: 45%; }
.total-row { display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 6px; color: #475569; }
.grand-row { border-top: 1.5px solid #071426; padding-top: 8px; margin-top: 8px; font-size: 13.5px; font-weight: 800; color: #064B86; }
.footer { background: #071426; border-radius: 4px; margin-top: 25px; padding: 14px 20px; text-align: center; color: #94A3B8; font-size: 10.5px; }
</style>
</head>
<body>
<div class="doc-page">

  <!-- A4 Header Section -->
  <div class="doc-header">
    <table class="header-table">
      <tr>
        <td style="width: 58px; vertical-align: middle;">
          <div class="logo-container">
            ${logoImgTag}
          </div>
        </td>
        <td style="vertical-align: middle; padding-left: 12px;">
          <h1 class="brand-name">AE RENEWABLE LTD</h1>
          <p class="brand-slogan">POWERING YOUR FUTURE WITH SUN</p>
          <p class="brand-address">RC: 9010643 • Abuja, Nigeria • info@aerenewable.com</p>
        </td>
        <td class="meta-badge" style="vertical-align: middle;">
          <span class="doc-type-label">ENGINEERING QUOTATION</span>
          <div class="doc-code">${quotationNumber}</div>
          <div class="doc-date">${todayFormatted}</div>
        </td>
      </tr>
    </table>

    <!-- Attached Client Portal Access Strip -->
    <div class="credentials-strip">
      <table class="creds-table">
        <tr>
          <td style="color: #071426;">
            <strong>🛡️ CLIENT PORTAL SECURE ACCESS:</strong> Save this quotation. Your account is provisioned:
          </td>
          <td style="text-align: right;">
            <span style="margin-right: 12px;">Username (Client ID): <strong style="color:#004AAD;">${safeUsername}</strong></span>
            <span style="margin-right: 12px;">Password: <strong style="color:#004AAD;">${safePassword}</strong></span>
            <a href="${loginUrl}" target="_blank" class="strip-link">Client Portal ↗</a>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Client & System Info -->
  <table class="client-info-table">
    <tr>
      <td class="info-card">
        <span class="col-title">PREPARED FOR CLIENT:</span>
        <div class="client-name">${safeName}</div>
        <p style="margin: 0 0 3px; font-size: 12px; color: #475569;">Residential Solar Installation • ${safeAddress}</p>
        <p style="margin: 0; font-size: 12px; color: #004AAD;">${email}</p>
      </td>
      <td class="info-card">
        <span class="col-title">SYSTEM SPECIFICATION:</span>
        <div class="client-name">${safePv} kW Solar PV / ${safeBattery} kWh Storage</div>
      </td>
    </tr>
  </table>

  <!-- Itemized BOQ Table Section -->
  <div style="margin-bottom: 24px;">
    <div class="section-title">BILL OF QUANTITIES (BOQ) & TECHNICAL SCHEDULE</div>
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">SN</th>
          <th style="width: 45%; text-align: left;">Item Description & Specification</th>
          <th style="width: 12%; text-align: center;">Unit</th>
          <th style="width: 10%; text-align: center;">Qty</th>
          <th style="width: 14%; text-align: right;">Rate (₦)</th>
          <th style="width: 14%; text-align: right;">Amount (₦)</th>
        </tr>
      </thead>
      <tbody>
        ${boqRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Summary Grid -->
  <table class="summary-table">
    <tr>
      <td class="notes-box">
        <h4>Engineering & Payment Terms</h4>
        <ul>
          <li>70% Mobilization Deposit upon order confirmation.</li>
          <li>20% upon delivery of equipment to site.</li>
          <li>10% upon complete testing, commissioning and handover.</li>
          <li>Tier-1 Jinko solar panels with 25-year performance warranty.</li>
          <li>LiFePO4 Lithium storage with 5-year replacement warranty.</li>
        </ul>
      </td>
      <td class="totals-box">
        <div class="total-row"><span>Materials Subtotal:</span><strong>₦${materialSubtotal}</strong></div>
        <div class="total-row"><span>Transportation & Logistics (5%):</span><strong>₦${transportCost}</strong></div>
        <div class="total-row"><span>Engineering Labour & Workmanship (18%):</span><strong>₦${labourCost}</strong></div>
        <div class="total-row"><span>Value Added Tax (VAT 7.5%):</span><strong>₦${vatCost}</strong></div>
        <div class="total-row grand-row"><span>GRAND TOTAL:</span><span>₦${safeAmount}</span></div>
      </td>
    </tr>
  </table>

  <!-- Signatures Footer: Clean, Clear & Structured Layout -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
    <tr>
      <td style="width: 46%; vertical-align: bottom; text-align: left; padding: 10px 0;">
        <div style="font-family: 'Caveat', 'Great Vibes', 'Segoe Script', 'Brush Script MT', cursive; font-size: 30px; font-weight: 700; color: #002B66; line-height: 34px; padding: 4px 0 2px;">
          Stephen Akolade
        </div>
        <div style="margin: 4px 0 6px;">
          <span style="display: inline-block; background: #E8F8EE; color: #007A30; border: 1px solid #86EFAC; font-size: 8.5px; font-weight: 800; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.5px; text-transform: uppercase;">
            CERTIFIED RENEWABLE ENGINEER
          </span>
        </div>
        <div style="border-bottom: 1.5px solid #071426; width: 100%; margin: 6px 0;"></div>
        <p style="font-weight: 800; font-size: 11.5px; color: #071426; margin: 0 0 2px;">Engr. Stephen Akolade <span style="font-weight: 600; color: #475569;">(Lead Solar Engineer)</span></p>
        <p style="color: #64748B; font-size: 10px; margin: 0;">AE Renewable Ltd Technical Design Office</p>
      </td>
      <td style="width: 8%;"></td>
      <td style="width: 46%; vertical-align: bottom; text-align: left; padding: 10px 0;">
        <div style="height: 50px; border: 1px dashed #CBD5E1; border-radius: 6px; background: #F8FAFC; text-align: center; line-height: 50px; margin-bottom: 6px;">
          <span style="font-size: 10px; color: #94A3B8; font-style: italic;">Awaiting Client Sign-off</span>
        </div>
        <div style="border-bottom: 1.5px solid #071426; width: 100%; margin: 6px 0;"></div>
        <p style="font-weight: 800; font-size: 11.5px; color: #071426; margin: 0 0 2px;">Client Acceptance Signature</p>
        <p style="color: #64748B; font-size: 10px; margin: 0;">Date: ________________________</p>
      </td>
    </tr>
  </table>

  <div class="footer">
    <strong style="color:#FFFFFF;">AE Renewable Ltd • Technical Design Office</strong>
    <p style="margin:3px 0 0; color:#94A3B8;">Abuja, Nigeria • RC: 9010643 • Contact: info@aerenewable.com</p>
  </div>

</div>
</body>
</html>`;

    return sendEmail({
        to: email,
        subject,
        text,
        html,
        attachments
    });
}

/* =========================================================
   SEND CLIENT CREDENTIALS EMAIL (TEMPORARY 1-TIME PASSWORD)
========================================================= */

async function sendClientCredentialsEmail(data) {
    let email = data.email;
    let fullName = data.name || data.fullName;
    let projectCode = data.projectCode;
    let username = data.username || data.projectCode;
    let password = data.tempPassword || data.password || "Client";
    let finalAmount = data.finalAmount;
    let pvCapacityKw = data.pvCapacityKw;
    let batteryCapacityKwh = data.batteryCapacityKwh;
    let address = data.address;
    let boqItems = data.boqItems;
    let commercial = data.commercial || {};
    let engineering = data.engineering || {};

    if (projectCode && (!boqItems || boqItems.length === 0 || !finalAmount)) {
        try {
            const { query } = require("../config/database");
            const pRes = await query(`
                SELECT p.*, q.total_amount AS q_total, q.item_breakdown, q.commercial_breakdown, q.system_specs,
                       c.contact_name AS client_name, c.email AS c_email, c.phone AS c_phone
                FROM projects p
                LEFT JOIN quotations q ON q.id = p.quotation_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE p.project_code = $1 OR p.id = $2
                LIMIT 1
            `, [projectCode, !isNaN(Number(projectCode)) ? Number(projectCode) : 0]);

            if (pRes.rows[0]) {
                const p = pRes.rows[0];
                fullName = fullName || p.client_name || p.contact_name;
                email = email || p.c_email || p.email;
                finalAmount = finalAmount || p.q_total || p.contract_value || p.original_contract_value || p.estimated_value;
                pvCapacityKw = pvCapacityKw || p.system_capacity_kw || (p.system_specs && p.system_specs.pv_capacity_kw);
                batteryCapacityKwh = batteryCapacityKwh || (p.system_specs && p.system_specs.battery_capacity_kwh);
                address = address || p.site_address || (p.city ? `${p.city}, Nigeria` : "Abuja, Nigeria");

                if ((!boqItems || boqItems.length === 0) && p.item_breakdown) {
                    try {
                        boqItems = typeof p.item_breakdown === "string" ? JSON.parse(p.item_breakdown) : p.item_breakdown;
                    } catch (e) {}
                }
                if ((!commercial || Object.keys(commercial).length === 0) && p.commercial_breakdown) {
                    try {
                        commercial = typeof p.commercial_breakdown === "string" ? JSON.parse(p.commercial_breakdown) : p.commercial_breakdown;
                    } catch (e) {}
                }
            }
        } catch (e) {
            console.warn("[EmailService] Database enrichment notice:", e.message);
        }
    }

    const firstName = (fullName || "Client").trim().split(" ")[0] || "Client";

    // Forward to full Engineering Quotation email so the client always receives the authoritative quotation, BOQ schedule, and credentials strip
    return sendClientQuotationEmail({
        email,
        fullName,
        projectCode,
        username: username || projectCode,
        password: password || firstName,
        finalAmount,
        pvCapacityKw,
        batteryCapacityKwh,
        address,
        loginUrl: `${process.env.APP_URL || "http://localhost:5000"}/client/login`,
        boqItems,
        commercial,
        engineering
    });
}


/* =========================================================
   SEND WEEKLY MAINTENANCE CHECK-UP EMAIL
========================================================= */

async function sendWeeklyMaintenanceCheckupEmail({ email, name, systemTitle, checkupUrl }) {
    const subject = "Weekly Solar System Health & Maintenance Consultation — AE Renewable";
    const safeName = escapeHtml(name || "Valued Client");
    const safeSystem = escapeHtml(systemTitle || "Solar Energy System");
    const url = checkupUrl || `${process.env.APP_URL || "http://localhost:5000"}/client/dashboard`;

    const text = `Hello ${name},\n\nThis is your weekly solar engineering check-up from AE Renewable regarding your ${systemTitle}.\n\nHow is your system performing this week? Please reply to this email with your observations or submit your write-up in your client portal at: ${url}\n\nBest regards,\nAE Renewable Technical Team`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #071426; margin: 0; padding: 20px; color: #1e293b; }
  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
  .header { background: linear-gradient(135deg, #071426 0%, #0d2847 100%); padding: 30px 24px; text-align: center; border-bottom: 3px solid #10b981; }
  .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; }
  .header p { color: #94a3b8; margin: 6px 0 0; font-size: 13px; }
  .content { padding: 30px 24px; }
  .notice-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 18px 0; color: #065f46; font-size: 13.5px; line-height: 1.5; }
  .btn { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 15px; }
  .footer { background: #0f172a; padding: 20px; text-align: center; color: #64748b; font-size: 11px; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>AE RENEWABLE LTD</h1>
    <p>Weekly Solar Health Consultation &bull; Technical Operations</p>
  </div>
  <div class="content">
    <h2 style="color:#0f172a; font-size:18px; margin-top:0;">Weekly System Check: ${safeName}</h2>
    <p style="color:#475569; font-size:14px; line-height:1.6;">
      As part of our commitment to 24/7 uptime and peak performance for your <strong>${safeSystem}</strong>, our engineering desk is performing our weekly maintenance check-in.
    </p>
    <div class="notice-box">
      <strong>📋 Weekly Maintenance Write-up:</strong>
      <p style="margin:6px 0 0;">
        How has your system performed this past week? Have you experienced any load surges, grid issues, or battery discharge anomalies? Simply reply directly to this email or submit your write-up in the client portal.
      </p>
    </div>
    <div style="text-align:center; margin-top:20px;">
      <a href="${url}" class="btn">Submit Weekly Report in Portal →</a>
    </div>
  </div>
  <div class="footer">
    <strong style="color:#ffffff;">AE Renewable Engineering &bull; Client Operations Desk</strong>
    <p style="margin:4px 0 0;">Abuja, Nigeria &bull; Engineering Hotline: +234 813 361 5132</p>
  </div>
</div>
</body>
</html>`;

    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
}

/* =========================================================
   CONSULTATION STATUS EMAILS
========================================================= */

async function sendConsultationAcceptedEmail({
    email,
    clientName,
    projectCode,
    quotationTotal,
    portalUrl,
    paymentUrl
}) {
    if (!email) return null;
    const safeName = escapeHtml(clientName || "Valued Client");
    const safeCode = escapeHtml(projectCode || "Consultation");
    const safeTotal = quotationTotal ? `₦${Number(quotationTotal).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "";
    const pUrl = portalUrl || (process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/client/dashboard#projects` : "http://localhost:5000/client/dashboard#projects");
    const payUrl = paymentUrl || (process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/client/dashboard#payments` : "http://localhost:5000/client/dashboard#payments");

    const subject = `✅ Consultation & Quotation Accepted: ${projectCode} — AE Renewable Ltd`;
    const text = `Dear ${clientName || "Client"},

Great news! AE Renewable has reviewed and approved your solar energy consultation and quotation (${projectCode}).
${safeTotal ? `Total Quotation Value: ${safeTotal}\n` : ""}
Your consultation status is now officially ACCEPTED.
You can review your complete engineering assessment and proceed to make your initial deposit to lock your installation schedule:

Project Portal: ${pUrl}
${payUrl ? `Payments Page: ${payUrl}\n` : ""}
Thank you for choosing AE Renewable Ltd.
Hotline: +234 813 361 5132`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background-color:#071426; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .email-card { max-width:600px; margin:24px auto; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 35px rgba(0,0,0,0.35); border:1px solid #1e293b; }
    .top-strip { height:4px; background:linear-gradient(90deg, #00b140 0%, #f4a600 50%, #004aad 100%); }
    .header-block { background-color:#071426; padding:24px 28px; }
    .content-body { padding:32px 28px; color:#1e293b; }
    .value-box { background-color:#f0fdf4; border:1px solid #bbf7d0; border-left:4px solid #16a34a; border-radius:10px; padding:18px 20px; margin:22px 0; }
    .footer-block { background-color:#071426; padding:22px 28px; text-align:center; border-top:1px solid #1e293b; }
  </style>
</head>
<body style="margin:0; padding:20px 10px; background-color:#071426; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div class="email-card" style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 35px rgba(0,0,0,0.35); border:1px solid #1e293b;">
    <!-- Top Brand Gradient Strip -->
    <div style="height:4px; background:linear-gradient(90deg, #00b140 0%, #f4a600 50%, #004aad 100%); line-height:4px; font-size:1px;">&nbsp;</div>
    
    <!-- Redesigned Executive Header with Logo -->
    <div style="background-color:#071426; padding:24px 28px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="width:52px; vertical-align:middle;">
            <img src="cid:aelogo" alt="AE Renewable Ltd" width="48" height="48" style="width:48px; height:48px; border-radius:10px; border:1.5px solid rgba(244,166,0,0.7); display:block; object-fit:contain; background:#ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.3);">
          </td>
          <td style="padding-left:14px; vertical-align:middle;">
            <h1 style="color:#ffffff; font-size:19px; font-weight:800; margin:0; letter-spacing:0.5px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height:1.2;">AE RENEWABLE LTD</h1>
            <p style="color:#f4a600; font-size:9.5px; font-weight:700; margin:3px 0 0; letter-spacing:1.2px; text-transform:uppercase;">Solar &amp; Clean Energy Solutions &bull; Official Notification</p>
          </td>
          <td style="text-align:right; vertical-align:middle;">
            <span style="display:inline-block; background-color:rgba(0,177,64,0.18); border:1px solid #00b140; color:#00b140; font-size:10px; font-weight:800; padding:5px 12px; border-radius:20px; letter-spacing:0.8px; text-transform:uppercase; white-space:nowrap;">● ACCEPTED</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Content Body -->
    <div style="padding:32px 28px; color:#1e293b;">
      <div style="margin-bottom:16px;">
        <span style="display:inline-block; background:#dcfce7; color:#15803d; padding:5px 14px; border-radius:16px; font-weight:800; font-size:12px; letter-spacing:0.5px;">● CONSULTATION ACCEPTED</span>
      </div>

      <h2 style="color:#071426; font-size:20px; font-weight:800; margin:0 0 14px; line-height:1.3;">Hello ${safeName},</h2>

      <p style="margin:0 0 16px; color:#334155; font-size:14.5px; line-height:1.6;">
        We are pleased to inform you that your solar energy consultation and itemized engineering quotation (<strong style="color:#004aad;">${safeCode}</strong>) has been reviewed and officially <strong style="color:#008730;">ACCEPTED</strong> by AE Renewable Ltd executive engineering desk.
      </p>

      ${safeTotal ? `
      <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-left:4px solid #16a34a; border-radius:10px; padding:18px 20px; margin:22px 0;">
        <div style="text-transform:uppercase; color:#166534; font-weight:800; font-size:11px; letter-spacing:1px; margin-bottom:4px;">Approved Quotation Value</div>
        <div style="font-size:25px; font-weight:800; color:#071426; letter-spacing:-0.5px;">${safeTotal}</div>
        <p style="margin:8px 0 0; font-size:13px; color:#15803d; font-weight:500; line-height:1.4;">
          Engineering sizing and itemized equipment specifications are locked.
        </p>
      </div>` : ""}

      <p style="margin:0 0 20px; color:#334155; font-size:14px; line-height:1.6;">
        To proceed with procurement and installation dispatch, please log in to your client portal and view the approved consultation or proceed to payments.
      </p>

      <!-- Bulletproof CTA Action Buttons -->
      <table border="0" cellpadding="0" cellspacing="0" style="margin-top:24px; border-collapse:separate;">
        <tr>
          <td style="padding-right:12px; padding-bottom:8px;">
            <a href="${pUrl}" target="_blank" style="display:inline-block; background-color:#004aad; color:#ffffff !important; text-decoration:none; padding:13px 24px; border-radius:8px; font-weight:700; font-size:14px; border:1px solid #003b8b; text-align:center; box-shadow:0 3px 10px rgba(0,74,173,0.25);">View Consultation &rarr;</a>
          </td>
          <td style="padding-bottom:8px;">
            <a href="${payUrl}" target="_blank" style="display:inline-block; background-color:#00b140; color:#ffffff !important; text-decoration:none; padding:13px 24px; border-radius:8px; font-weight:700; font-size:14px; border:1px solid #008730; text-align:center; box-shadow:0 3px 10px rgba(0,177,64,0.25);">Proceed to Payment &rarr;</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background-color:#071426; padding:22px 28px; text-align:center; border-top:1px solid #1e293b;">
      <strong style="color:#ffffff; font-size:13px; display:block; letter-spacing:0.5px;">AE Renewable Ltd Operations Desk</strong>
      <p style="margin:6px 0 0; color:#94a3b8; font-size:11.5px; line-height:1.5;">
        Abuja, Nigeria &bull; Engineering Support: +234 813 361 5132 &bull; support@aerenewable.com
      </p>
    </div>
  </div>
</body>
</html>`;

    return sendEmail({
        to: email,
        subject,
        text,
        html,
        attachments: [
            {
                filename: "logodark.png",
                path: path.join(__dirname, "../../public/images/logodark.png"),
                cid: "aelogo"
            }
        ]
    });
}

async function sendConsultationPendingEmail({
    email,
    clientName,
    projectCode,
    portalUrl
}) {
    if (!email) return null;
    const safeName = escapeHtml(clientName || "Valued Client");
    const safeCode = escapeHtml(projectCode || "Consultation");
    const pUrl = portalUrl || (process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/client/dashboard#projects` : "http://localhost:5000/client/dashboard#projects");

    const subject = `◌ Consultation Pending Review: ${projectCode} — AE Renewable Ltd`;
    const text = `Dear ${clientName || "Client"},

Your solar energy consultation (${projectCode}) is currently PENDING review by our technical team.
We are reviewing the energy profiling parameters, roof layout, and equipment availability.

You can monitor the review progress in your client portal:
${pUrl}

AE Renewable Ltd
Abuja, Nigeria • +234 813 361 5132`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background-color:#071426; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .email-card { max-width:600px; margin:24px auto; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 35px rgba(0,0,0,0.35); border:1px solid #1e293b; }
    .top-strip { height:4px; background:linear-gradient(90deg, #f4a600 0%, #004aad 100%); }
    .header-block { background-color:#071426; padding:24px 28px; }
    .content-body { padding:32px 28px; color:#1e293b; }
    .footer-block { background-color:#071426; padding:22px 28px; text-align:center; border-top:1px solid #1e293b; }
  </style>
</head>
<body style="margin:0; padding:20px 10px; background-color:#071426; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div class="email-card" style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 35px rgba(0,0,0,0.35); border:1px solid #1e293b;">
    <!-- Top Brand Gradient Strip -->
    <div style="height:4px; background:linear-gradient(90deg, #f4a600 0%, #004aad 100%); line-height:4px; font-size:1px;">&nbsp;</div>
    
    <!-- Redesigned Executive Header with Logo -->
    <div style="background-color:#071426; padding:24px 28px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="width:52px; vertical-align:middle;">
            <img src="cid:aelogo" alt="AE Renewable Ltd" width="48" height="48" style="width:48px; height:48px; border-radius:10px; border:1.5px solid rgba(244,166,0,0.7); display:block; object-fit:contain; background:#ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.3);">
          </td>
          <td style="padding-left:14px; vertical-align:middle;">
            <h1 style="color:#ffffff; font-size:19px; font-weight:800; margin:0; letter-spacing:0.5px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height:1.2;">AE RENEWABLE LTD</h1>
            <p style="color:#f4a600; font-size:9.5px; font-weight:700; margin:3px 0 0; letter-spacing:1.2px; text-transform:uppercase;">Technical Operations Desk</p>
          </td>
          <td style="text-align:right; vertical-align:middle;">
            <span style="display:inline-block; background-color:rgba(244,166,0,0.18); border:1px solid #f4a600; color:#f4a600; font-size:10px; font-weight:800; padding:5px 12px; border-radius:20px; letter-spacing:0.8px; text-transform:uppercase; white-space:nowrap;">● PENDING</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Content Body -->
    <div style="padding:32px 28px; color:#1e293b;">
      <div style="margin-bottom:16px;">
        <span style="display:inline-block; background:#fef3c7; color:#b45309; padding:5px 14px; border-radius:16px; font-weight:800; font-size:12px; letter-spacing:0.5px;">◌ PENDING TECHNICAL REVIEW</span>
      </div>

      <h2 style="color:#071426; font-size:20px; font-weight:800; margin:0 0 14px; line-height:1.3;">Hello ${safeName},</h2>

      <p style="margin:0 0 16px; color:#334155; font-size:14.5px; line-height:1.6;">
        Your consultation record (<strong style="color:#004aad;">${safeCode}</strong>) has been marked as <strong>Pending Review</strong> while our technical team reviews your system sizing and equipment availability.
      </p>

      <p style="margin:0 0 20px; color:#334155; font-size:14px; line-height:1.6;">
        We will notify you immediately once the technical review is completed. You can view your project status at any time in the client portal.
      </p>

      <!-- Bulletproof CTA Action Button -->
      <table border="0" cellpadding="0" cellspacing="0" style="margin-top:24px; border-collapse:separate;">
        <tr>
          <td>
            <a href="${pUrl}" target="_blank" style="display:inline-block; background-color:#004aad; color:#ffffff !important; text-decoration:none; padding:13px 26px; border-radius:8px; font-weight:700; font-size:14px; border:1px solid #003b8b; text-align:center; box-shadow:0 3px 10px rgba(0,74,173,0.25);">View in Portal &rarr;</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background-color:#071426; padding:22px 28px; text-align:center; border-top:1px solid #1e293b;">
      <strong style="color:#ffffff; font-size:13px; display:block; letter-spacing:0.5px;">AE Renewable Ltd &bull; Technical Operations</strong>
      <p style="margin:6px 0 0; color:#94a3b8; font-size:11.5px; line-height:1.5;">
        Engineering Desk &bull; +234 813 361 5132 &bull; support@aerenewable.com
      </p>
    </div>
  </div>
</body>
</html>`;

    return sendEmail({
        to: email,
        subject,
        text,
        html,
        attachments: [
            {
                filename: "logodark.png",
                path: path.join(__dirname, "../../public/images/logodark.png"),
                cid: "aelogo"
            }
        ]
    });
}

async function sendConsultationDeletedEmail({
    email,
    clientName,
    projectCode,
    reason = ""
}) {
    if (!email) return null;
    const safeName = escapeHtml(clientName || "Valued Client");
    const safeCode = escapeHtml(projectCode || "Consultation");

    const subject = `Consultation Notice: ${projectCode} — AE Renewable Ltd`;
    const text = `Dear ${clientName || "Client"},

This is an administrative notification that consultation record (${projectCode}) has been removed or archived.${reason ? ` Reason: ${reason}` : ""}

If you have any questions, please contact our support team at +234 813 361 5132.

AE Renewable Ltd`;

    const html = `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif; padding:20px; color:#334155;">
  <h2>Hello ${safeName},</h2>
  <p>This is to confirm that consultation record <strong>${safeCode}</strong> has been removed or archived from the system.${reason ? `<br>Reason: ${escapeHtml(reason)}` : ""}</p>
  <p>If you believe this was in error, please contact your account representative.</p>
  <p><strong>AE Renewable Ltd</strong><br>+234 813 361 5132</p>
</body>
</html>`;

    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    verifyEmailConfiguration,
    sendEmail,
    sendInstallerVerificationCode,
    sendPasswordResetCode,
    sendClientQuotationEmail,
    sendClientCredentialsEmail,
    sendWeeklyMaintenanceCheckupEmail,
    sendConsultationAcceptedEmail,
    sendConsultationPendingEmail,
    sendConsultationDeletedEmail,
    buildComplete28BOQ
};


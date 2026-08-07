import sgMail from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is missing.");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendRewardEmail({
  customerEmail,
  customerName,
  discountCode,
  cashbackAmount,
  expiryDate,
}) {
  try {
    const message = {
      to: customerEmail,

      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME,
      },

      subject: "🎉 Your Cashback Reward is Ready!",

      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
        </head>

        <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 20px;">

                <table
                  width="600"
                  cellpadding="0"
                  cellspacing="0"
                  style="background:#ffffff;border-radius:8px;padding:40px;"
                >

                  <tr>
                    <td align="center">

                      <h2 style="margin-bottom:10px;">
                        🎉 Cashback Reward Generated
                      </h2>

                      <p style="font-size:16px;">
                        Hello <strong>${customerName || "Customer"}</strong>,
                      </p>

                      <p>
                        Thank you for shopping with Darveys.
                      </p>

                      <p>
                        Your cashback reward has been generated successfully.
                      </p>

                    </td>
                  </tr>

                  <tr>
                    <td>

                      <table
                        width="100%"
                        cellpadding="10"
                        cellspacing="0"
                        style="margin-top:30px;border-collapse:collapse;"
                      >

                        <tr>
                          <td><strong>Cashback</strong></td>
                          <td>£${cashbackAmount}</td>
                        </tr>

                        <tr>
                          <td><strong>Coupon Code</strong></td>
                          <td>
                            <span
                              style="
                                background:#f4f4f4;
                                padding:8px 14px;
                                border-radius:6px;
                                font-weight:bold;
                                letter-spacing:1px;
                              "
                            >
                              ${discountCode}
                            </span>
                          </td>
                        </tr>

                        <tr>
                          <td><strong>Valid Until</strong></td>
                          <td>${expiryDate}</td>
                        </tr>

                      </table>

                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding-top:30px;">

                      <p>
                        Apply this coupon during checkout to redeem your cashback reward.
                      </p>

                    </td>
                  </tr>

                  <tr>
                    <td
                      align="center"
                      style="padding-top:30px;color:#777;font-size:13px;"
                    >

                      Thank you,
                      <br>
                      <strong>Darveys Team</strong>

                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>
      `,
    };

    const [response] = await sgMail.send(message);

    console.log("========== SENDGRID EMAIL ==========");
    console.log("Status :", response.statusCode);
    console.log("Recipient :", customerEmail);
    console.log("====================================");

    return {
      success: true,
      statusCode: response.statusCode,
    };

  } catch (error) {
    console.error("========== SENDGRID ERROR ==========");

    if (error.response) {
      console.error(JSON.stringify(error.response.body, null, 2));
    } else {
      console.error(error);
    }

    console.error("====================================");

    throw error;
  }
}
import { sendRewardEmail } from "../services/reward-email.service.server";

export async function loader() {
  await sendRewardEmail({
    customerEmail: "animeshdarveys@gmail.com",
    customerName: "Animesh",
    discountCode: "TEST-12345",
    cashbackAmount: "£25",
    expiryDate: "30 Sep 2026",
  });

  return Response.json({
    success: true,
  });
}
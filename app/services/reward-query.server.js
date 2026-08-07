import prisma from "../db.server";

export async function getRewards(shop) {
  return await prisma.reward.findMany({
    where: {
      shop,
    },
    select: {
      id: true,
      orderId: true,
      orderName: true,
      customerId: true,
      customerEmail: true,
      customerName: true,
      discountCode: true,
      cashbackAmount: true,
      status: true,
      deliveredAt: true,
      eligibleAt: true,
      generatedAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
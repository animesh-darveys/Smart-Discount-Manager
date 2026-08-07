import prisma from "../db.server";

export async function getAllDiscountOffers(shop) {
  return await prisma.discountOffer.findMany({
    where: {
      shop,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
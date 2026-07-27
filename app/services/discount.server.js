import prisma from "../db.server";

/**
 * Get paginated discounts
 */
export async function getDiscounts({
  page = 1,
  limit = 10,
}) {
  const skip = (page - 1) * limit;

  const [discounts, total] = await Promise.all([
    prisma.discountOffer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.discountOffer.count(),
  ]);

  return {
    discounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get single discount by ID
 */
export async function getDiscountById(id) {
  return prisma.discountOffer.findUnique({
    where: {
      id,
    },
  });
}
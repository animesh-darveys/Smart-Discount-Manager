import prisma from "../db.server";

/**
 * Get paginated discounts
 */
export async function getDiscounts({
  page = 1,
  limit = 8,
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

  const formattedDiscounts = discounts.map((discount) => ({
    ...discount,
    formattedCreatedAt: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(discount.createdAt),
  }));

  return {
    discounts: formattedDiscounts,
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

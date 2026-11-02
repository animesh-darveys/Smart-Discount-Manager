import { Prisma } from "@prisma/client";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { toCustomerGid } from "../utils/customer-ids.server";

// Storefront (cart / checkout page) endpoint, reached through the Shopify
// App Proxy:  GET /apps/smart-discount/customer-discounts?collectionId=<gid>
//
// Shopify signs every proxied request; authenticate.public.appProxy rejects
// unsigned ones. The customer comes from Shopify's signed
// logged_in_customer_id, never from the browser, so a visitor only ever
// sees their own vouchers plus discounts open to everyone.

const PUBLIC_FIELDS = {
  id: true,
  title: true,
  discountCode: true,
  discountCategory: true,
  discountType: true,
  discountValue: true,
  minimumPurchase: true,
  appliesTo: true,
  startDate: true,
  endDate: true,
  source: true,
  cashbackAmount: true,
};

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json(
      { success: false, error: "App is not installed on this shop." },
      { status: 404 }
    );
  }

  const url = new URL(request.url);

  const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");
  const customerId = loggedInCustomerId
    ? toCustomerGid(loggedInCustomerId)
    : null;

  const collectionId = url.searchParams.get("collectionId")?.trim();

  if (collectionId && !/^gid:\/\/shopify\/Collection\/\d+$/.test(collectionId)) {
    return Response.json(
      { success: false, error: "Invalid collectionId." },
      { status: 400 }
    );
  }

  const now = new Date();

  const notCustomerSpecific = {
    customerIds: { equals: Prisma.AnyNull },
  };

  const discounts = await prisma.discountOffer.findMany({
    where: {
      shop: session.shop,
      status: "active",
      startDate: { lte: now },
      AND: [
        {
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
        {
          OR: [
            // 1. Discounts for this logged-in customer
            ...(customerId
              ? [{ customerIds: { array_contains: [customerId] } }]
              : []),

            // 2. Collection discounts open to every customer
            ...(collectionId
              ? [
                  {
                    ...notCustomerSpecific,
                    selectedCollections: {
                      array_contains: [{ id: collectionId }],
                    },
                  },
                ]
              : []),

            // 3. Global / order discounts: no customer, no collection
            {
              ...notCustomerSpecific,
              selectedCollections: { equals: Prisma.AnyNull },
            },
          ],
        },
      ],
    },
    select: PUBLIC_FIELDS,
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json(
    {
      success: true,
      loggedIn: Boolean(customerId),
      discounts,
    },
    {
      headers: {
        // Per-customer data: never cache in shared caches.
        "Cache-Control": "private, no-store",
      },
    }
  );
}

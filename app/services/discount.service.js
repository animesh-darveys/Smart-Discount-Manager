export async function createDiscount(data) {
  const response = await fetch("/app/api/discounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}
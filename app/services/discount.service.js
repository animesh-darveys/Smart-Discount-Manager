export async function createDiscountApi(data) {
  const response = await fetch("/app/api/discounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

export async function updateDiscountApi(id, data) {
  const response = await fetch("/app/api/discounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      id,
      mode: "edit",
    }),
  });

  return response.json();
}

export async function deleteDiscountApi(id) {
  const response = await fetch("/app/api/discounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      mode: "delete",
    }),
  });

  return response.json();
}
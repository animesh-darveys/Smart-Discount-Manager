export function toTitleCase(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function toUpperCase(text = "") {
  return text.toUpperCase();
}

export function toLowerCase(text = "") {
  return text.toLowerCase();
}

export function capitalize(text = "") {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
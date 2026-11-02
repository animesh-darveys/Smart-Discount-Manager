import { useState } from "react";
import { validateDiscount } from "../utils/validateDiscount";
import {
  createDiscountApi,
  updateDiscountApi,
} from "../services/discount.service";

export function useDiscountSubmit() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const submit = async (formData) => {
    // Clear old errors
    setErrors({});
    setSubmitError("");

    // Client-side validation
    const validationErrors = validateDiscount(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      return {
        success: false,
        type: "validation",
      };
    }

    try {
      setLoading(true);

      const result =
        formData.mode === "edit"
          ? await updateDiscountApi(formData.id, formData)
          : await createDiscountApi(formData);

      // API/Shopify error
      if (!result?.success) {
        const message =
          result?.message || "Unable to save discount.";

        setSubmitError(message);

        return {
          success: false,
          type: "api",
          message,
        };
      }

      return result;
    } catch (error) {
      console.error("Discount submit error:", error);

      const message =
        error?.message ||
        "Something went wrong while saving the discount.";

      setSubmitError(message);

      return {
        success: false,
        type: "network",
        message,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    submit,
    loading,
    errors,
    submitError,
  };
}
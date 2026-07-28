import { useState } from "react";
import { validateDiscount } from "../utils/validateDiscount";
import {
  createDiscountApi,
  updateDiscountApi,
} from "../services/discount.service";

export function useDiscountSubmit() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (formData) => {
    const validationErrors = validateDiscount(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return { success: false };
    }

    setErrors({});

    try {
      setLoading(true);

      const result =
        formData.mode === "edit"
          ? await updateDiscountApi(formData.id, formData)
          : await createDiscountApi(formData);

      return result;
    } catch (error) {
      console.error(error);

      return {
        success: false,
        message: "Something went wrong.",
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    submit,
    loading,
    errors,
  };
}
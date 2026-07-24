import { useState } from "react";
import { Page, BlockStack } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

import DiscountGeneralCard from "../components/discounts/DiscountGeneralCard";
import DiscountConfigurationCard from "../components/discounts/DiscountConfigurationCard";
import ProductSelectionCard from "../components/discounts/ProductSelectionCard";
import CustomerEligibilityCard from "../components/discounts/CustomerEligibilityCard";
import ScheduleCard from "../components/discounts/ScheduleCard";
import UsageLimitCard from "../components/discounts/UsageLimitCard";
import StatusCard from "../components/discounts/StatusCard";
import SaveActions from "../components/discounts/SaveActions";
import DiscountCategoryCard from "../components/discounts/DiscountCategoryCard";

import { validateDiscount } from "../utils/validateDiscount";

export default function NewDiscount() {
    // General Information
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Discount Configuration
    const [discountCode, setDiscountCode] = useState("");
    const [discountType, setDiscountType] = useState("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [minimumPurchase, setMinimumPurchase] = useState("");

    // Product Eligibility
    const [appliesTo, setAppliesTo] = useState("ALL_PRODUCTS");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedCollections, setSelectedCollections] = useState([]);

    const shopify = useAppBridge();


    const [customerEligibility, setCustomerEligibility] = useState("all");
    const [customerIds, setCustomerIds] = useState("");

    const [startDate, setStartDate] = useState(
  new Date().toISOString().split("T")[0]
);
    const [endDate, setEndDate] = useState("");
    const [hasEndDate, setHasEndDate] = useState(false);

    const [usageLimit, setUsageLimit] = useState("");
    const [limitPerCustomer, setLimitPerCustomer] = useState(false);

    const [status, setStatus] = useState("active");

    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({});

    const [discountCategory, setDiscountCategory] = useState("ORDER");

    const handleSelectProducts = async () => {
        try {
            const products = await shopify.resourcePicker({
                type: "product",
                multiple: true,
                selectionIds: selectedProducts.map((product) => ({
                    id: product.id,
                })),
            });

            if (!products) return;

            // console.log("Selected Products:", products);

            setSelectedProducts(
                products.map((product) => ({
                    id: product.id,
                    title: product.title,
                    vendor: product.vendor,
                    image: product.images?.[0]?.originalSrc ?? "",
                    handle: product.handle,
                    status: product.status,
                }))
            );
        } catch (error) {
            console.error("Product Picker Error:", error);
        }
    };

    const handleSelectCollections = async () => {
        try {
            const collections = await shopify.resourcePicker({
                type: "collection",
                multiple: true,
                selectionIds: selectedCollections.map((collection) => ({
                    id: collection.id,
                })),
            });

            if (!collections) return;

            console.log("Selected Collections:", collections);

            setSelectedCollections(
                collections.map((collection) => ({
                    id: collection.id,
                    title: collection.title,
                    image: collection.image?.originalSrc ?? "",
                    handle: collection.handle,
                }))
            );
        } catch (error) {
            console.error("Collection Picker Error:", error);
        }
    };

    const handleSelectCustomers = async () => {
        const customers = await shopify.resourcePicker({
            type: "customer",
            multiple: true,
            selectionIds: selectedCustomers.map((customer) => ({
                id: customer.id,
            })),
        });

        if (!customers) return;

        setSelectedCustomers(
            customers.map((customer) => ({
                id: customer.id,
                displayName: customer.displayName,
                email: customer.email,
            }))
        );
    };

    const handleRemoveCustomer = (id) => {
        setSelectedCustomers((prev) =>
            prev.filter((customer) => customer.id !== id)
        );
    };

    const handleCreateDiscount = async () => {
        const validationErrors = validateDiscount({
            title,
            description,
            discountCode,
            discountValue,
            minimumPurchase,
            startDate,
            endDate,
            hasEndDate,
            usageLimit,
            appliesTo,
            selectedProducts,
            selectedCollections,
            customerEligibility,
            customerIds,
        });

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        // Create Shopify Discount
        try {
            setLoading(true);

            const response = await fetch("/app/api/discounts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    title,
                    description,
                    discountCategory,
                    discountCode,
                    discountType,
                    discountValue,

                    minimumPurchase,

                    appliesTo,
                    selectedProducts,
                    selectedCollections,

                    customerEligibility,
                    customerIds,
                    startDate,
                    endDate,
                    hasEndDate,

                    usageLimit,
                    limitPerCustomer,

                    status,
                }),
            });

            const result = await response.json();

            console.log(result);

            if (result.success) {
                alert("Discount saved successfully.");
            } else {
                alert(result.message);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
        // Save Database
    };

    const handleSaveDraft = async () => {
        try {
            setLoading(true);

            console.log("Save Draft");

            // TODO
            // Save only in database with status = draft

        } finally {
            setLoading(false);
        }
    };

    return (
        <Page title="Create Discount">
            <s-grid
                gridTemplateColumns="5fr 3fr"
                gap="small"
                justifyContent="center"
            >
                <BlockStack gap="400">

                    <DiscountGeneralCard
                        title={title}
                        description={description}
                        onTitleChange={setTitle}
                        onDescriptionChange={setDescription}
                        errors={errors}
                    />
                    <DiscountConfigurationCard
                        discountCode={discountCode}
                        discountType={discountType}
                        discountValue={discountValue}
                        minimumPurchase={minimumPurchase}
                        onDiscountCodeChange={setDiscountCode}
                        onDiscountTypeChange={setDiscountType}
                        onDiscountValueChange={setDiscountValue}
                        onMinimumPurchaseChange={setMinimumPurchase}
                        errors={errors}
                    />
                    <DiscountCategoryCard
                        discountCategory={discountCategory}
                        onCategoryChange={setDiscountCategory}
                    />
                    
                    {discountCategory === "PRODUCT" && (

                        <ProductSelectionCard
                            appliesTo={appliesTo}
                            selectedProducts={selectedProducts}
                            selectedCollections={selectedCollections}
                            onAppliesToChange={setAppliesTo}
                            onSelectProducts={handleSelectProducts}
                            onSelectCollections={handleSelectCollections}
                            onRemoveProduct={(id) =>
                                setSelectedProducts((prev) =>
                                    prev.filter((product) => product.id !== id)
                                )
                            }
                            onRemoveCollection={(id) =>
                                setSelectedCollections((prev) =>
                                    prev.filter((collection) => collection.id !== id)
                                )
                            }
                        />
                    )}
                    <CustomerEligibilityCard
                        customerEligibility={customerEligibility}
                        customerIds={customerIds}
                        onEligibilityChange={setCustomerEligibility}
                        onCustomerIdsChange={setCustomerIds}
                    />
                    <UsageLimitCard
                        usageLimit={usageLimit}
                        limitPerCustomer={limitPerCustomer}
                        onUsageLimitChange={setUsageLimit}
                        onLimitPerCustomerChange={setLimitPerCustomer}
                    />
                    <SaveActions
                        loading={loading}
                        onCreate={handleCreateDiscount}
                    />
                </BlockStack>
                <BlockStack gap="400">


                    <StatusCard
                        status={status}
                        onStatusChange={setStatus}
                    />
                    <ScheduleCard
                        startDate={startDate}
                        endDate={endDate}
                        hasEndDate={hasEndDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onHasEndDateChange={setHasEndDate}
                    />

                </BlockStack>
            </s-grid>

        </Page>
    );
}
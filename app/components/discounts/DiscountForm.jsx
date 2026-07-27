import { useState } from "react";
import { Page, BlockStack, InlineGrid } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

import DiscountGeneralCard from "../discounts/DiscountGeneralCard";
import DiscountConfigurationCard from "../discounts/DiscountConfigurationCard";
import ProductSelectionCard from "../discounts/ProductSelectionCard";
import CustomerEligibilityCard from "../discounts/CustomerEligibilityCard";
import ScheduleCard from "../discounts/ScheduleCard";
import UsageLimitCard from "../discounts/UsageLimitCard";
import StatusCard from "../discounts/StatusCard";
import SaveActions from "../discounts/SaveActions";
import DiscountCategoryCard from "../discounts/DiscountCategoryCard";

import { validateDiscount } from "../../utils/validateDiscount";

export default function DiscountForm() {
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


    const [customerEligibility, setCustomerEligibility] = useState("all_customer");
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

    const [discountCategory, setDiscountCategory] = useState("order");

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

    return (
        <Page title="Create Discount">
            <InlineGrid
                columns={{
                    xs: 1,
                    md: "2fr 1fr",
                }}
                gap="400"
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

                    {discountCategory === "product" && (

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
            </InlineGrid>

        </Page>
    );
}
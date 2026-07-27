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

import { useDiscountSubmit } from "../../hooks/useDiscountSubmit";

import { openResourcePicker } from "../../services/resourcePicker.service";

import {
    mapProduct,
    mapCollection,
} from "../../services/resourceMapper";


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

    const {
        submit,
        loading,
        errors,
    } = useDiscountSubmit();

    const [discountCategory, setDiscountCategory] = useState("order");

    const resetForm = () => {
        setTitle("");
        setDescription("");

        setDiscountCode("");
        setDiscountType("PERCENTAGE");
        setDiscountValue("");
        setMinimumPurchase("");

        setAppliesTo("ALL_PRODUCTS");
        setSelectedProducts([]);
        setSelectedCollections([]);

        setCustomerEligibility("all_customer");
        setCustomerIds("");

        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate("");
        setHasEndDate(false);

        setUsageLimit("");
        setLimitPerCustomer(false);

        setStatus("active");

        setDiscountCategory("order");
    };

    const handleSelectProducts = () =>
        openResourcePicker({
            shopify,
            type: "product",
            selectedItems: selectedProducts,
            mapper: mapProduct,
            setSelectedItems: setSelectedProducts,
        });

    const handleSelectCollections = () =>
        openResourcePicker({
            shopify,
            type: "collection",
            selectedItems: selectedCollections,
            mapper: mapCollection,
            setSelectedItems: setSelectedCollections,
        });

    const handleCreateDiscount = async () => {
        const result = await submit({
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
        });

        if (!result.success) return;

        alert("Discount saved successfully.");

        resetForm();
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
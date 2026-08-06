import { useState, useEffect } from "react";
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
import { BannerExample } from "../discounts/feedback"
import { openResourcePicker } from "../../services/resourcePicker.service";
import { Outlet } from "react-router";
import {
    mapProduct,
    mapCollection,
} from "../../services/resourceMapper";

import { formatDate } from "../../utils/formateDate";


export default function DiscountForm({
    mode = "create",
    discount = null,
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Discount Configuration
    const [discountCode, setDiscountCode] = useState("");
    const [discountType, setDiscountType] = useState("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [minimumPurchase, setMinimumPurchase] = useState("");

    // Product Eligibility
    const [appliesTo, setAppliesTo] = useState("products");
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

        setAppliesTo("products");
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

    const handleSelectProducts = () => {
        // Clear collections when selecting products
        setSelectedCollections([]);

        return openResourcePicker({
            shopify,
            type: "product",
            selectedItems: selectedProducts,
            mapper: mapProduct,
            setSelectedItems: setSelectedProducts,
        });
    };

    const handleSelectCollections = () => {
        // Clear products when selecting collections
        setSelectedProducts([]);

        return openResourcePicker({
            shopify,
            type: "collection",
            selectedItems: selectedCollections,
            mapper: mapCollection,
            setSelectedItems: setSelectedCollections,
        });
    };
    const handleDiscountCategoryChange = (value) => {
        setDiscountCategory(value);

        if (value === "product") {
            setAppliesTo("products");
        } else {
            setSelectedProducts([]);
            setSelectedCollections([]);
        }
    };
    const handleCustomerEligibilityChange = (value) => {
        setCustomerEligibility(value);
        if (value === "all_customer") {
            setCustomerIds("");
        }
    };

    const handleSubmit = async () => {
        const result = await submit({
            id: discount?.id,
            mode,

            title,
            description,

            discountCategory,

            discountCode,
            discountType,
            discountValue,
            minimumPurchase,

            appliesTo:
                discountCategory === "order"
                    ? "all"
                    : appliesTo,
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

        alert(
            mode === "edit"
                ? "Discount updated successfully."
                : "Discount created successfully."
        );

        if (mode === "create") {
            resetForm();
        }
    };

    useEffect(() => {
        if (mode !== "edit" || !discount) return;

        setTitle(discount.title || "");
        setDescription(discount.description || "");

        setDiscountCode(discount.discountCode || "");
        setDiscountType(discount.discountType || "PERCENTAGE");
        setDiscountValue(discount.discountValue || "");
        setMinimumPurchase(discount.minimumPurchase || "");

        setAppliesTo(discount.appliesTo || "products");

        setSelectedProducts(discount.selectedProducts || []);
        setSelectedCollections(discount.selectedCollections || []);

        setCustomerEligibility(
            discount.customerEligibility || "all_customer"
        );

        setCustomerIds(discount.customerIds || "");

        setStartDate(
            discount.startDate
                ? formatDate(discount.startDate)
                : formatDate(new Date())
        );

        setEndDate(formatDate(discount.endDate));

        setHasEndDate(!!discount.endDate);

        setUsageLimit(discount.usageLimit || "");
        setLimitPerCustomer(discount.limitPerCustomer || false);

        setStatus(discount.status || "active");

        setDiscountCategory(discount.discountCategory || "order");

    }, [mode, discount]);

    return (
        <Page title={mode === "edit" ? "Edit Discount" : "Create Discount"}>
            <Outlet />
            <InlineGrid
                columns={{
                    xs: 1,
                    md: "5fr 3fr",
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
                        mode={mode}
                    />
                    <DiscountCategoryCard
                        discountCategory={discountCategory}
                        onCategoryChange={handleDiscountCategoryChange}
                        mode={mode}
                    />

                    {discountCategory === "product" && (

                        <ProductSelectionCard
                            appliesTo={appliesTo}
                            selectedProducts={selectedProducts}
                            selectedCollections={selectedCollections}
                            onAppliesToChange={setAppliesTo}
                            onSelectProducts={handleSelectProducts}
                            onSelectCollections={handleSelectCollections}
                            mode={mode}
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
                            onResetProducts={() => setSelectedProducts([])}
                            onResetCollections={() => setSelectedCollections([])}
                        />
                    )}
                    <CustomerEligibilityCard
                        customerEligibility={customerEligibility}
                        customerIds={customerIds}
                        onEligibilityChange={handleCustomerEligibilityChange}
                        onCustomerIdsChange={setCustomerIds}
                    />
                    <UsageLimitCard
                        usageLimit={usageLimit}
                        limitPerCustomer={limitPerCustomer}
                        onUsageLimitChange={setUsageLimit}
                        onLimitPerCustomerChange={setLimitPerCustomer}
                    />
                    <SaveActions
                        mode={mode}
                        loading={loading}
                        onSubmit={handleSubmit}
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
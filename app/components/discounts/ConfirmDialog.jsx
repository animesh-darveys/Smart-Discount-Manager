import {
  Modal,
  Text,
} from "@shopify/polaris";

export default function ConfirmDialog({
  open,
  title,
  message,
  loading = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      primaryAction={{
        content: confirmText,
        loading,
        destructive,
        onAction: onConfirm,
      }}
      secondaryActions={[
        {
          content: cancelText,
          onAction: onCancel,
        },
      ]}
    >
      <Modal.Section>
        <Text as="p">
          {message}
        </Text>
      </Modal.Section>
    </Modal>
  );
}
import {
  Modal,
  Text,
} from "@shopify/polaris";
import PropTypes from "prop-types";

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

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,

  loading: PropTypes.bool,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  destructive: PropTypes.bool,

  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
// test

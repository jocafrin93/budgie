import ModalSystem from './ModalSystem';
import UnifiedItemForm from './UnifiedItemForm';
import CategoryForm from './form/CategoryForm';

/**
 * Manages different types of modal forms for items and categories
 */
const ModalFormManager = ({
  isOpen,
  onClose,
  modalType,
  itemToEdit = null,
  onSave,
  categories = [],
  accounts = [],
  currentPay = 0,
  preselectedCategory = null,
  darkMode = false
}) => {
  // Modal configuration based on type
  const getModalConfig = () => {
    switch (modalType) {
      case 'add-item':
        return {
          title: 'Add New Item',
          size: 'lg'
        };
      case 'edit-item':
        return {
          title: `Edit ${itemToEdit?.name || 'Item'}`,
          size: 'lg'
        };
      case 'add-category':
        return {
          title: 'Add New Category',
          size: 'md'
        };
      case 'edit-category':
        return {
          title: `Edit ${itemToEdit?.name || 'Category'}`,
          size: 'md'
        };
      default:
        return {
          title: 'Form',
          size: 'md'
        };
    }
  };

  // Handle form submission
  const handleSave = (formData) => {
    onSave(formData);
    onClose();
  };

  // Get the appropriate form component based on modal type
  const renderForm = () => {
    switch (modalType) {
      case 'add-item':
      case 'edit-item':
        return (
          <UnifiedItemForm
            item={itemToEdit}
            onSave={handleSave}
            onCancel={onClose}
            categories={categories}
            accounts={accounts}
            currentPay={currentPay}
            preselectedCategory={preselectedCategory}
            darkMode={darkMode}
          />
        );
      case 'add-category':
      case 'edit-category':
        return (
          <CategoryForm
            category={itemToEdit}
            onSave={handleSave}
            onCancel={onClose}
            darkMode={darkMode}
          />
        );
      default:
        return null;
    }
  };

  const config = getModalConfig();

  return (
    <ModalSystem
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      size={config.size}
    >
      {renderForm()}
    </ModalSystem>
  );
};

export default ModalFormManager;
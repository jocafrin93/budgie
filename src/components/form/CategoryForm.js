import { useForm } from '../../hooks/useForm';
import {
  BaseForm,
  ColorPickerField,
  TextField
} from './';

const CategoryForm = ({
  category = null,
  onSave,
  onCancel,
  darkMode = false
}) => {
  // Initialize form with useForm hook
  const initialValues = {
    name: category?.name || '',
    color: category?.color || 'bg-gradient-to-r from-purple-500 to-pink-500', // Default to purple-pink gradient
    description: category?.description || ''
  };

  const form = useForm({
    initialValues,
    onSubmit: (values) => {
      // Only include ID if we're editing an existing category
      const formData = category
        ? { ...values, id: category.id }
        : values;

      onSave(formData);
    },
    validate: (values) => {
      const errors = {};

      if (!values.name.trim()) {
        errors.name = 'Name is required';
      }

      if (!values.color) {
        errors.color = 'Color is required';
      }

      return errors;
    }
  });

  return (
    <BaseForm
      onSubmit={form.handleSubmit}
      onCancel={onCancel}
      submitLabel={category ? 'Update Category' : 'Add Category'}
      isSubmitDisabled={!form.isValid}
    >
      <TextField
        {...form.getFieldProps('name')}
        label="Category Name"
        placeholder="Enter category name"
        autoFocus
        required
        darkMode={darkMode}
      />

      <ColorPickerField
        {...form.getFieldProps('color')}
        label="Category Color"
        required
        darkMode={darkMode}
      />

      <TextField
        {...form.getFieldProps('description')}
        label="Description"
        placeholder="Optional description"
        multiline
        rows={3}
        darkMode={darkMode}
      />
    </BaseForm>
  );
};

export default CategoryForm;
import React from 'react';
import { BaseForm, TextField, ColorPickerField } from './form';
import { useForm } from '../hooks/useForm';

const AddCategoryForm = ({
  onSave,
  onCancel,
  categoryColors,
  darkMode,
  category = null,
}) => {
  // Initialize form with useForm hook
  const form = useForm({
    initialValues: {
      name: category?.name || '',
      color: category?.color || categoryColors[0],
    },
    onSubmit: (values, options) => {
      onSave(values, options?.addAnother);
      
      // Reset form if adding another
      if (options?.addAnother) {
        form.resetForm();
        setTimeout(() => {
          const nameInput = document.querySelector('input[name="name"]');
          if (nameInput) nameInput.focus();
        }, 100);
      }
    },
    validate: (values) => {
      const errors = {};
      
      if (!values.name) {
        errors.name = 'Category name is required';
      }
      
      return errors;
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    form.handleSubmit();
  };
  
  // Handle "save and add another" submission
  const handleSubmitAnother = () => {
    form.handleSubmit(null, { addAnother: true });
  };

  return (
    <BaseForm
      onSubmit={handleSubmit}
      onSubmitAnother={handleSubmitAnother}
      onCancel={onCancel}
      submitLabel={category ? 'Update Category' : 'Add Category'}
      isSubmitDisabled={!form.values.name}
      isSubmitAnotherDisabled={!form.values.name}
      showSubmitAnother={!category}
    >
      <TextField
        {...form.getFieldProps('name')}
        label="Category Name"
        placeholder="Category name"
        autoFocus
        required
        darkMode={darkMode}
      />
      
      <ColorPickerField
        {...form.getFieldProps('color')}
        label="Color"
        colors={categoryColors}
        required
      />
    </BaseForm>
  );
};

export default AddCategoryForm;
/**
 * useForm hook
 * A custom hook for form state management, validation, and submission
 */
import { useCallback, useState } from 'react';

export const useForm = ({
  initialValues = {},
  onSubmit,
  validate,
}) => {
  // Form state
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set a specific field value
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: fieldValue,
    }));
  }, []);

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur if validate function is provided
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  }, [validate, values]);

  // Handle form submission
  const handleSubmit = useCallback((e, options = {}) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});

      setTouched(allTouched);

      // If there are errors, don't submit
      if (Object.keys(validationErrors).length > 0) {
        setIsSubmitting(false);
        return;
      }
    }

    // Call onSubmit with values and options
    if (onSubmit) {
      onSubmit(values, options);
    }

    setIsSubmitting(false);
  }, [validate, values, onSubmit]);

  // Get props for a field
  const getFieldProps = useCallback((name) => {
    return {
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] ? errors[name] : undefined,
    };
  }, [values, handleChange, handleBlur, touched, errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
    getFieldProps,
  };
};

export default useForm;
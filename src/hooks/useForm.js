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
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmissionAttempted(false);
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

    // Only validate if there has been a submission attempt
    if (submissionAttempted && validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  }, [validate, values, submissionAttempted]);

  // Handle form submission
  const handleSubmit = useCallback((e, options = {}) => {
    console.log('DEBUG - useForm handleSubmit called');
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);
    setSubmissionAttempted(true);

    // Validate all fields
    if (validate) {
      console.log('DEBUG - Running form validation');
      const validationErrors = validate(values);
      console.log('DEBUG - Validation errors:', validationErrors);
      setErrors(validationErrors);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});

      setTouched(allTouched);

      // If there are errors, don't submit
      if (Object.keys(validationErrors).length > 0) {
        console.log('DEBUG - Form has validation errors, not submitting');
        setIsSubmitting(false);
        return;
      }
    }

    // Call onSubmit with values and options
    console.log('DEBUG - Form passed validation, calling onSubmit with values:', values);
    if (onSubmit) {
      try {
        console.log('DEBUG - onSubmit type:', typeof onSubmit);
        onSubmit(values, options);
        console.log('DEBUG - onSubmit called successfully');
      } catch (error) {
        console.error('DEBUG - Error in onSubmit:', error);
      }
    } else {
      console.error('DEBUG - onSubmit is not defined or not a function');
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
      // Only show errors after a submission attempt
      error: submissionAttempted && touched[name] ? errors[name] : undefined,
    };
  }, [values, handleChange, handleBlur, touched, errors, submissionAttempted]);

  // Compute whether the form is valid (no errors)
  const isValid = Object.keys(errors).length === 0;

  // Debug validation status
  console.log('DEBUG - Form validation status:', {
    isValid,
    errors,
    errorCount: Object.keys(errors).length,
    submissionAttempted
  });

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid, // Add explicit isValid property
    submissionAttempted,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
    getFieldProps,
  };
};

export default useForm;
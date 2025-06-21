/**
 * BaseForm component
 * A base component for all forms with common structure and behavior
 */

const BaseForm = ({
  onSubmit,
  onCancel,
  onSubmitAnother,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitAnotherLabel = '+',
  submitAnotherTitle = 'Save and add another (Shift+Enter)',
  isSubmitDisabled = false,
  isSubmitAnotherDisabled = false,
  showSubmitAnother = false,
  className = '',
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.isDefaultPrevented()) {
      e.preventDefault();
      if (e.shiftKey && onSubmitAnother && !isSubmitAnotherDisabled) {
        onSubmitAnother();
      } else if (onSubmit && !isSubmitDisabled) {
        onSubmit();
      }
    } else if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className={`space-y-4 ${className}`} onKeyDown={handleKeyDown}>
      {/* Form content */}
      {children}

      {/* Action buttons */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 btn-primary py-2 px-4 rounded"
          disabled={isSubmitDisabled}
        >
          {submitLabel}
        </button>

        {showSubmitAnother && onSubmitAnother && (
          <button
            type="button"
            onClick={onSubmitAnother}
            className="btn-primary py-2 px-3 rounded"
            disabled={isSubmitAnotherDisabled}
            title={submitAnotherTitle}
          >
            {submitAnotherLabel}
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 rounded border border-theme-primary text-theme-secondary hover:bg-theme-hover"
          >
            {cancelLabel}
          </button>
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <div className="text-xs text-theme-tertiary mt-2">
        💡 Press Enter to save
        {showSubmitAnother && ' • Shift+Enter to save & add another'}
        {onCancel && ' • Escape to cancel'}
      </div>
    </div>
  );
};

export default BaseForm;
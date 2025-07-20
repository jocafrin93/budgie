// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef, useEffect, useRef } from "react";

// Local Imports
import { ApplyWrapper } from "components/shared/ApplyWrapper";
import { mergeRefs } from "hooks";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const disabledClass =
  "before:[mask-image:var(--tw-thumb)] before border-base-200 bg-base-200 pointer-events-none select-none opacity-70 bg-base-200";

const variants = {
  basic:
    "border-base-300/70 bg-origin-border before before before:[background-size:100%_100%] before:[background-image:var(--tw-thumb)] checked checked indeterminate indeterminate hover:bg-base-200 focus:bg-base-200",
  outlined:
    "border-base-300/70 before before:[mask-image:var(--tw-thumb)] checked hover:bg-base-200 focus:bg-base-200",
};

const Checkbox = forwardRef((props, ref) => {
  const {
    variant = "basic",
    unstyled,
    color = "primary",
    type = "checkbox",
    className,
    classNames = {},
    label,
    disabled,
    indeterminate,
    labelProps,
    ...rest
  } = props;

  const inputRef = useRef();

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <ApplyWrapper
      when={!!label}
      wrapper={(children) => (
        <label
          className={clsx(
            "input-label inline-flex items-center gap-2",
            classNames?.label,
          )}
          {...labelProps}
        >
          {children}
          <span className={clsx("label", classNames?.labelText)}>{label}</span>
        </label>
      )}
    >
      <input
        className={clsx(
          "form-checkbox",
          !unstyled && [
            setThisClass(color),
            disabled ? disabledClass : variants[variant],
          ],
          className,
          classNames?.input,
        )}
        disabled={disabled}
        data-disabled={disabled}
        data-indeterminate={indeterminate}
        ref={mergeRefs(inputRef, ref)}
        type={type}
        {...rest}
      />
    </ApplyWrapper>
  );
});

Checkbox.displayName = "Checkbox";

Checkbox.propTypes = {
  variant: PropTypes.oneOf(["outlined", "basic"]),
  unstyled: PropTypes.bool,
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
  ]),
  type: PropTypes.string,
  className: PropTypes.string,
  classNames: PropTypes.object,
  label: PropTypes.node,
  disabled: PropTypes.bool,
  indeterminate: PropTypes.bool,
  labelProps: PropTypes.object,
};

export { Checkbox };


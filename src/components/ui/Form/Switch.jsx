// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { ApplyWrapper } from "components/shared/ApplyWrapper";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const disabledClass =
  "before bg-base-200 border border-base-300 pointer-events-none select-none opacity-70 bg-base-200";

const variants = {
  basic:
    "bg-base-300 before checked checked:before:before focus:ring-2 focus:ring-primary focus:ring-2 focus:ring-primary",
  outlined:
    "is-outline border-base-300/70 border before checked checked:before:before focus:ring-2 focus:ring-primary focus:ring-2 focus:ring-primary",
};

const Switch = forwardRef((props, ref) => {
  const {
    variant = "basic",
    unstyled,
    color = "primary",
    className,
    classNames = {},
    label,
    role = "switch",
    disabled,
    labelProps,
    ...rest
  } = props;

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
          <span className={clsx("label", classNames.labelText)}>{label}</span>
        </label>
      )}
    >
      <input
        className={clsx(
          "form-switch",
          !unstyled && [
            setThisClass(color),
            disabled ? disabledClass : variants[variant],
          ],
          className,
          classNames?.input,
        )}
        disabled={disabled}
        type="checkbox"
        role={role}
        ref={ref}
        {...rest}
      />
    </ApplyWrapper>
  );
});

Switch.displayName = "Switch";

Switch.propTypes = {
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
  className: PropTypes.string,
  classNames: PropTypes.object,
  role: PropTypes.string,
  label: PropTypes.node,
  disabled: PropTypes.bool,
  labelProps: PropTypes.object,
};

export { Switch };


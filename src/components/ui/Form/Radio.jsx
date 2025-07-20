// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { ApplyWrapper } from "components/shared/ApplyWrapper";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const disabledClass =
  "before:[mask-image:var(--tw-thumb)] before border-base-200 bg-base-200 pointer-events-none select-none opacity-70 bg-base-200";

const variants = {
  basic:
    "border-base-300/70 bg-origin-border before before before:[background-size:100%_100%] before:[background-image:var(--tw-thumb)] checked checked hover:bg-base-200 focus:bg-base-200",
  outlined:
    "border-base-300/70 before before:[mask-image:var(--tw-thumb)] checked hover:bg-base-200 focus:bg-base-200",
};

const Radio = forwardRef((props, ref) => {
  const {
    variant = "basic",
    unstyled,
    color = "primary",
    className,
    classNames = {},
    type = "radio",
    label,
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
          <span className={clsx("label", classNames?.labelText)}>{label}</span>
        </label>
      )}
    >
      <input
        className={clsx(
          "form-radio",
          !unstyled && [
            setThisClass(color),
            disabled ? disabledClass : variants[variant],
          ],
          className,
          classNames?.input,
        )}
        disabled={disabled}
        data-disabled={disabled}
        type={type}
        ref={ref}
        {...rest}
      />
    </ApplyWrapper>
  );
});

Radio.displayName = "Radio";

Radio.propTypes = {
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
  type: PropTypes.string,
  label: PropTypes.node,
  disabled: PropTypes.bool,
  labelProps: PropTypes.object,
};

export { Radio };


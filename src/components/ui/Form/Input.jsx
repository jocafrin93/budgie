// Import Dependencies
import { clsx } from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { useId } from "hooks";
import { InputErrorMsg } from "./InputErrorMsg";

// ----------------------------------------------------------------------

const Input = forwardRef((props, ref) => {
  const {
    component,
    label,
    prefix,
    suffix,
    description,
    className,
    classNames,
    error,
    unstyled,
    disabled,
    type = "text",
    rootProps,
    labelProps,
    id,
    ...rest
  } = props;

  const Component = component || "input";
  const inputId = useId(id, "input");

  const affixClass = clsx(
    "absolute top-0 flex h-full w-9 items-center justify-center transition-colors",
    error
      ? "text-error"
      : "text-base-content/60 peer-focus:border-primary",
  );

  return (
    <div className={clsx("input-root", classNames?.root)} {...rootProps}>
      {label && (
        <label
          htmlFor={inputId}
          className={clsx("input-label", classNames?.label)}
          {...labelProps}
        >
          <span className={clsx("input-label", classNames?.labelText)}>
            {label}
          </span>
        </label>
      )}

      <div
        className={clsx(
          "input-wrapper relative",
          label && "mt-1.5",
          classNames?.wrapper,
        )}
      >
        <Component
          className={clsx(
            "form-input-base",
            suffix && "ltr:pr-9 rtl:pl-9",
            prefix && "ltr:pl-9 rtl:pr-9",
            !unstyled && [
              "form-input",
              error
                ? "border-error"
                : [
                  disabled
                    ? "cursor-not-allowed border-base-300 bg-base-200 opacity-60"
                    : "peer border-primary/20 bg-transparent hover:border-primary/30 focus:border-primary focus:bg-base-100/50",
                ],
            ],
            className,
            classNames?.input,
          )}
          type={type}
          id={inputId}
          ref={ref}
          disabled={disabled}
          {...rest}
        />
        {prefix && (
          <div
            className={clsx(
              "prefix ltr:left-0 rtl:right-0",
              affixClass,
              classNames?.prefix,
            )}
          >
            {prefix}
          </div>
        )}
        {suffix && (
          <div
            className={clsx(
              "suffix ltr:right-0 rtl:left-0",
              affixClass,
              classNames?.suffix,
            )}
          >
            {suffix}
          </div>
        )}
      </div>
      <InputErrorMsg
        when={error && typeof error !== "boolean"}
        className={classNames?.error}
      >
        {error}
      </InputErrorMsg>
      {description && (
        <span
          className={clsx(
            "input-description mt-1 text-xs text-base-content/60",
            classNames?.description,
          )}
        >
          {description}
        </span>
      )}
    </div>
  );
});

Input.displayName = "Input";

Input.propTypes = {
  component: PropTypes.elementType,
  label: PropTypes.node,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  description: PropTypes.string,
  className: PropTypes.string,
  classNames: PropTypes.object,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.node]),
  unstyled: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  rootProps: PropTypes.object,
  labelProps: PropTypes.object,
  id: PropTypes.string,
};

export { Input };

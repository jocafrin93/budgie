// Import Dependencies
import clsx from 'clsx';
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { COLORS } from "constants/app.constant";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const variants = {
  filled:
    "bg-this text-white hover:bg-base-200 focus:bg-base-200 active:bg-base-200/80 disabled",
  soft: "text-this-darker bg-this-darker/[.08] hover:bg-this-darker/[0.15] focus:bg-this-darker/[0.15] active:bg-this-darker/[0.20]",
  outlined:
    "text-this-darker border border-this-darker hover:bg-this-darker/[0.05] focus:bg-this-darker/[0.05] active:bg-this-darker/[0.05]",
  flat: "text-this-darker hover:bg-this-darker/[0.08] focus:bg-this-darker/[0.08] active:bg-this-darker/[0.15]",
};

const neutralVariants = {
  filled:
    "bg-base-200 text-base-content hover:bg-base-200 focus:bg-base-200 active:bg-base-200/80",
  soft: "bg-base-200/30 text-base-content hover:bg-this-darker/[0.15] focus:bg-this-darker/[0.15] active:bg-base-200/80",
  outlined:
    "border border-base-300 hover:bg-base-200 focus:bg-base-200 active:bg-base-200/80",
  flat: "hover:bg-base-200 focus:bg-base-200 active:bg-base-200/80",
};

const Button = forwardRef((props, ref) => {
  const {
    component,
    className,
    children,
    color,
    isIcon,
    variant = "filled",
    unstyled,
    type = "button",
    isGlow,
    disabled,
    onClick,
    ...rest
  } = props;

  const Component = component || "button";
  const mergedColor = color || "neutral";

  return (
    <Component
      className={clsx(
        "btn-base",
        !unstyled
          ? [
            "btn",
            isIcon && "shrink-0 p-0",
            mergedColor === "neutral"
              ? [
                neutralVariants[variant],
                isGlow &&
                "shadow-lg shadow-gray-200/50",
              ]
              : [
                setThisClass(mergedColor),
                variants[variant],
                isGlow &&
                "shadow-soft shadow-this/50",
              ],
          ]
          : color && color !== "neutral" && setThisClass(color),
        className,
      )}
      type={type}
      ref={ref}
      disabled={disabled}
      data-disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Component>
  );
});

Button.displayName = "Button";

Button.propTypes = {
  children: PropTypes.node,
  component: PropTypes.elementType,
  className: PropTypes.string,
  type: PropTypes.string,
  isIcon: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  color: PropTypes.oneOf(COLORS),
  variant: PropTypes.oneOf(["filled", "outlined", "soft", "flat"]),
  unstyled: PropTypes.bool,
  isGlow: PropTypes.bool,
};

export { Button };


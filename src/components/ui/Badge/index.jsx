// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { COLORS } from "constants/app.constant";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const variants = {
  filled: "text-white bg-this",
  outlined:
    "border border-this/30 text-this",
  soft: "text-this-darker bg-this-darker/[0.07]",
};

const neutralVariants = {
  filled: "bg-base-300 text-base-content",
  outlined:
    "border border-base-300 text-base-content",
  soft: "bg-base-300/30 text-base-content bg-base-100/30",
};

const Badge = forwardRef((props, ref) => {
  const {
    component,
    className,
    unstyled,
    variant = "filled",
    color,
    isGlow,
    children,
    ...rest
  } = props;

  const Component = component || "div";
  const mergedColor = color || "neutral";

  return (
    <Component
      className={clsx(
        "badge-base",
        !unstyled
          ? [
            "badge",
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
                "shadow-lg shadow-this/50",
              ],
          ]
          : color && color !== "neutral" && setThisClass(color),
        className,
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </Component>
  );
});

Badge.displayName = "Badge";

Badge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  component: PropTypes.elementType,
  variant: PropTypes.oneOf(["filled", "outlined", "soft"]),
  color: PropTypes.oneOf(COLORS),
  unstyled: PropTypes.bool,
  isGlow: PropTypes.bool,
};

export { Badge };


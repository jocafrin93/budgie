// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { COLORS } from "constants/app.constant";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const variants = {
  filled:
    "bg-this text-white hover:bg-base-200 focus:bg-base-200 active:bg-base-200/80 disabled",
  outlined:
    "border border-base-300 text-this hover:bg-base-200 focus:bg-base-200",
  soft: "text-this-darker bg-this-darker/[0.07] hover:text-success focus:border-primary focus:bg-this-darker/[0.13]",
};

const neutralVariants = {
  filled:
    "bg-base-200 text-base-content hover:bg-base-200 focus:bg-base-200 active:bg-base-200/80",
  outlined:
    "border border-base-300 text-base-content hover:bg-base-200 focus:bg-base-200 text-base-content",
  soft: "text-this-darker bg-base-200/10 hover:bg-base-200 focus:bg-base-200 active:bg-base-200/80 bg-base-100/10",
};

const Tag = forwardRef((props, ref) => {
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

  const Element = component || "a";
  const resolvedColor = color || "neutral";

  return (
    <Element
      className={clsx(
        "tag-base",
        !unstyled
          ? [
            "tag",
            resolvedColor === "neutral"
              ? [
                neutralVariants[variant],
                isGlow &&
                "shadow-lg shadow-gray-200/50",
              ]
              : [
                setThisClass(resolvedColor),
                variants[variant],
                isGlow &&
                "shadow-soft shadow-this/50",
              ],
          ]
          : color && color !== "neutral" && setThisClass(color),
        className,
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </Element>
  );
});

Tag.displayName = "Tag";

Tag.propTypes = {
  className: PropTypes.string,
  component: PropTypes.elementType,
  children: PropTypes.node,
  variant: PropTypes.oneOf(["filled", "outlined", "soft"]),
  color: PropTypes.oneOf(COLORS),
  unstyled: PropTypes.bool,
  isGlow: PropTypes.bool,
};

export { Tag };


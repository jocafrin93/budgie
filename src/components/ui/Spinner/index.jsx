// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { COLORS } from "constants/app.constant";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const Spinner = forwardRef((props, ref) => {
  const {
    className,
    animate = true,
    isElastic,
    disabled,
    variant = "default",
    color = "neutral",
    unstyled,
    ...rest
  } = props;

  if (variant === "default" || variant === "soft") {
    return (
      <div
        ref={ref}
        className={clsx(
          "spinner spinner-base rounded-full",
          isElastic && "is-elastic",
          animate && !disabled && "animate-spin",
          disabled && "opacity-50",
          !unstyled && [
            variant === "default"
              ? [
                color === "neutral"
                  ? "border-base-300"
                  : [setThisClass(color), "border-this"],
                "border-r-transparent",
              ]
              : [
                color === "neutral"
                  ? "border-base-200 border-r-gray-500"
                  : [
                    setThisClass(color),
                    "border-this/30 border-r-this",
                  ],
              ],
          ],
          className,
        )}
        disabled={disabled}
        {...rest}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={clsx(
        "spinner-base",
        isElastic && "is-elastic",
        animate && !disabled && "animate-spin",
        disabled && "opacity-50",
        !unstyled && [
          color === "neutral"
            ? "text-base-content/60"
            : [setThisClass(color), "text-this"],
        ],
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        className="h-full w-full"
        viewBox="0 0 28 28"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M28 14c0 7.732-6.268 14-14 14S0 21.732 0 14 6.268 0 14 0s14 6.268 14 14zm-2.764.005c0 6.185-5.014 11.2-11.2 11.2-6.185 0-11.2-5.015-11.2-11.2 0-6.186 5.015-11.2 11.2-11.2 6.186 0 11.2 5.014 11.2 11.2zM8.4 16.8a2.8 2.8 0 100-5.6 2.8 2.8 0 000 5.6z"
          clipRule="evenodd"
        ></path>
      </svg>
    </div>
  );
});

Spinner.displayName = "Spinner";

Spinner.propTypes = {
  animate: PropTypes.bool,
  isElastic: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  color: PropTypes.oneOf(COLORS),
  unstyled: PropTypes.bool,
  variant: PropTypes.oneOf(["default", "soft", "innerDot"]),
};

export { GhostSpinner } from "./GhostSpinner";
export { Spinner };


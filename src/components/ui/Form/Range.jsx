// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { COLORS } from "constants/app.constant";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const Range = forwardRef((props, ref) => {
  const {
    className,
    color = "neutral",
    thumbSize,
    trackSize,
    style,
    ...rest
  } = props;

  return (
    <input
      type="range"
      className={clsx(
        "form-range",
        color === "neutral"
          ? "text-base-content/60"
          : [setThisClass(color), "text-this"],
        className,
      )}
      ref={ref}
      style={{
        "--thumb-size": thumbSize,
        "--track-h:": trackSize,
        ...style,
      }}
      {...rest}
    />
  );
});

Range.displayName = "Range";

Range.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf(COLORS),
  thumbSize: PropTypes.string,
  trackSize: PropTypes.string,
  style: PropTypes.object,
};

export { Range };


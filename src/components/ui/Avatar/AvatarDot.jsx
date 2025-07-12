// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { COLORS } from "constants/app.constant";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const AvatarDot = forwardRef((props, ref) => {
  const { color = "neutral", isPing, className, children, ...rest } = props;

  return (
    <div
      className={clsx(
        "avatar-dot absolute rounded-full",
        color === "neutral"
          ? "bg-base-300 bg-base-100"
          : [setThisClass(color), "bg-this"],
        className,
      )}
      {...rest}
      ref={ref}
    >
      {isPing && (
        <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-inherit opacity-80" />
      )}
      {children}
    </div>
  );
});

AvatarDot.displayName = "AvatarDot";

AvatarDot.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf(COLORS),
  isPing: PropTypes.bool,
  children: PropTypes.node,
};

export { AvatarDot };


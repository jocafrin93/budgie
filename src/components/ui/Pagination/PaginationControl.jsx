// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { usePaginationContext } from "./Pagination.context";

// ----------------------------------------------------------------------

const PaginationControl = forwardRef((props, ref) => {
  const ctx = usePaginationContext();

  const { component, active, className, disabled, children, ...rest } = props;

  const Component = component || "button";

  return (
    <Component
      {...rest}
      disabled={disabled}
      data-active={active || undefined}
      data-disabled={disabled || undefined}
      ref={ref}
      className={clsx(
        "pagination-control cursor-pointer",
        [
          active
            ? "active this:primary bg-this text-white disabled:cursor-not-allowed disabled disabled:opacity-60"
            : [
              disabled
                ? "disabled:cursor-not-allowed disabled:opacity-60"
                : "hover:bg-base-200 focus:bg-base-200 active",
            ],
        ],
        ctx.classNames?.control,
        className,
      )}
    >
      {children}
    </Component>
  );
});

PaginationControl.propTypes = {
  component: PropTypes.elementType,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

PaginationControl.displayName = "PaginationControl";

export { PaginationControl };


// Import Dependencies
import clsx from 'clsx';
import PropTypes from "prop-types";
import { forwardRef } from "react";

// Local Imports
import { useThemeContext } from "app/contexts/theme/context";
import { Box } from "components/ui";

// -------------------------------------------------------------

const Card = forwardRef((props, ref) => {
  const { cardSkin } = useThemeContext();

  const { skin = cardSkin, children, className, ...rest } = props;

  return (
    <Box
      ref={ref}
      className={clsx(
        "card rounded-lg",
        skin &&
        skin !== "none" && [
          skin === "bordered" &&
          "border border-base-300 print",
          (skin === "shadow" || skin === "shadowed") &&
          "bg-base-100 shadow-soft print:shadow-none",
        ],
        className,
      )}
      {...rest}
    >
      {children}
    </Box>
  );
});

Card.displayName = "Card";

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  skin: PropTypes.oneOf(["none", "bordered", "shadow"]),
};

export { Card };

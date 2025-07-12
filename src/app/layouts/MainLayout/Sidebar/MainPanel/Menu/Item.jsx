// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { useRouteLoaderData } from "react-router";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { Badge } from "components/ui";
import { createScopedKeydownHandler } from "utils/dom/createScopedKeydownHandler";

// ----------------------------------------------------------------------

export function Item({
  id,
  title,
  isActive,
  Icon,
  component,
  onKeyDown,
  ...rest
}) {
  const Element = component || "button";
  const { lgAndUp } = useBreakpointsContext();
  const info = useRouteLoaderData("root")?.[id]?.info;

  return (
    <Element
      data-root-menu-item
      {...{
        "data-tooltip": lgAndUp ? true : undefined,
        "data-tooltip-content": title,
        "data-tooltip-place": "right",
      }}
      className={clsx(
        "relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg outline-hidden transition-colors duration-200",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-base-content/60 hover:bg-primary/20 hover:text-base-content/80 focus:bg-primary/20 focus:text-base-content/80 active:bg-primary/25 active:text-base-content",
      )}
      onKeyDown={createScopedKeydownHandler({
        siblingSelector: "[data-root-menu-item]",
        parentSelector: "[data-root-menu]",
        activateOnFocus: false,
        loop: true,
        orientation: "vertical",
        onKeyDown,
      })}
      {...rest}
    >
      {Icon && <Icon className="size-7" />}
      {info && info.val && (
        <Badge
          color={info.color}
          className="text-tiny-plus absolute top-0 right-0 -m-1 h-4 min-w-[1rem] rounded-full px-1 py-0 ring-1 ring-base-100"
        >
          <span> {info.val}</span>
        </Badge>
      )}
    </Element>
  );
}

Item.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  Icon: PropTypes.elementType.isRequired,
  component: PropTypes.elementType,
  onKeyDown: PropTypes.func,
};

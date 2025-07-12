// Import Dependencies
import clsx from "clsx";

// Local Imports
import { useSidebarContext } from "app/contexts/sidebar/context";

// ----------------------------------------------------------------------

export function SidebarToggleBtn() {
  const { toggle, isExpanded } = useSidebarContext();

  return (
    <button
      onClick={toggle}
      className={clsx(
        isExpanded && "active",
        "sidebar-toggle-btn cursor-pointer flex size-7 flex-col justify-center space-y-1.5 text-primary outline-hidden focus:outline-none ltr:ml-0.5 rtl:mr-0.5",
      )}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

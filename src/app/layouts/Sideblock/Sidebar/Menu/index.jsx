// Import Dependencies
import { useRef } from "react";
import { useIsomorphicEffect } from "hooks";
import SimpleBar from "simplebar-react";

// Local Imports
import { navigation } from "app/navigation";
import { MenuItem } from "./Group/MenuItem";

// ----------------------------------------------------------------------

export function Menu() {
  const { ref } = useRef();

  useIsomorphicEffect(() => {
    const activeItem = ref?.current?.querySelector("[data-menu-active=true]");
    activeItem?.scrollIntoView({ block: "center" });
  }, []);

  // Handle case where navigation might be undefined
  if (!navigation || !Array.isArray(navigation)) {
    return (
      <div className="p-4 text-center text-base-content/60">
        Navigation not available
      </div>
    );
  }

  return (
    <SimpleBar
      scrollableNodeProps={{ ref }}
      className="h-full overflow-x-hidden pb-6"
    >
      <div className="px-6 pt-6">
        <div className="flex flex-col space-y-1.5">
          {navigation.map((nav) => (
            <MenuItem key={nav.id} data={nav} />
          ))}
        </div>
      </div>
    </SimpleBar>
  );
}

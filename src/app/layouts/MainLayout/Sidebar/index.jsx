// Import Dependencies
import { useMemo, useState } from "react";
import { useLocation } from "react-router";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { navigation } from "app/navigation";
import { useDidUpdate } from "hooks";
import { isRouteActive } from "utils/isRouteActive";
import { MainPanel } from "./MainPanel";

// ----------------------------------------------------------------------

export function Sidebar() {
  const { pathname } = useLocation();
  const { isOpen } = useSidebarContext();
  const { lgAndDown } = useBreakpointsContext();

  const [activeGroup, setActiveGroup] = useState("");

  const activeRoute = useMemo(() => {
    return navigation.find((item) => isRouteActive(item.path, pathname));
  }, [pathname]);

  useDidUpdate(() => {
    if (activeRoute?.group) {
      setActiveGroup(activeRoute.group);
    }
  }, [activeRoute]);

  if (lgAndDown && !isOpen) return null;

  return <MainPanel nav={navigation} activeSegment={activeGroup} setActiveSegment={setActiveGroup} />;
}

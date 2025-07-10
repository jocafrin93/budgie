// Import Dependencies
import clsx from "clsx";
import { Outlet } from "react-router";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { Sidebar } from "./Sidebar";

// ----------------------------------------------------------------------

export default function MainLayout() {
  const { mdAndDown } = useBreakpointsContext();

  return (
    <>
      <Header />
      <main
        className={clsx("main-content transition-content grid grid-cols-1")}
      >
        <Outlet />
      </main>
      {mdAndDown ? <MobileBottomNav /> : <Sidebar />}
    </>
  );
}

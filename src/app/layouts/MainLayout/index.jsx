// Import Dependencies
import { Outlet } from "react-router";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import DaisyUIWrapper from "components/shared/DaisyUIWrapper";
import AppLogo from "../../../assets/appLogo.svg?react";
import { useCloudStorageStatus } from "../../../hooks/useCloudStorageStatus";
import { MobileBottomNav } from "./MobileBottomNav";
import { Sidebar } from "./Sidebar";

// ----------------------------------------------------------------------

// Minimal header component - shows always, logo only on mobile
function MinimalHeader() {
  const { mdAndDown } = useBreakpointsContext();
  const { isAuthenticated, isLoading, signIn, signOut } = useCloudStorageStatus();

  const handleCloudToggle = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      signIn();
    }
  };

  return (
    <header className={`sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-base-300 bg-base-300 backdrop-blur-sm px-4 ${mdAndDown ? '' : 'md:ml-16'}`}>
      <div className="flex items-center gap-3">
        {mdAndDown && <AppLogo className="h-8 w-8 text-primary" />}
        <h1 className="text-lg font-semibold text-base-content">Budgie</h1>
      </div>
      <button
        onClick={handleCloudToggle}
        disabled={isLoading}
        className="btn btn-ghost btn-sm btn-circle"
        title={isAuthenticated ? "Google Drive Connected - Click to disconnect" : "Connect to Google Drive"}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : isAuthenticated ? (
          <span className="text-success text-lg">☁️</span>
        ) : (
          <span className="text-base-content/40 text-lg">☁️</span>
        )}
      </button>
    </header>
  );
}

export default function MainLayout() {
  const { mdAndDown } = useBreakpointsContext();

  return (
    <DaisyUIWrapper>
      <div className="min-h-screen">
        <MinimalHeader />
        {!mdAndDown && <Sidebar />}
        <main className={`${mdAndDown ? 'pb-20' : 'pb-0 md:ml-16'}`}>
          <Outlet />
        </main>
        {mdAndDown && <MobileBottomNav />}
      </div>
    </DaisyUIWrapper>
  );
}

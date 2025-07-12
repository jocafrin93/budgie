// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

// Local Imports
import SearchIcon from "assets/dualicons/search.svg?react";
import { SidebarToggleBtn } from "components/shared/SidebarToggleBtn";
import { LanguageSelector } from "components/template/LaguageSelector";
import { Notifications } from "components/template/Notifications";
import { RightSidebar } from "components/template/RightSidebar";
import { Search } from "components/template/Search";
import { Button } from "components/ui";

// ----------------------------------------------------------------------

function SlashIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        d="M3.5.5h12c1.7 0 3 1.3 3 3v13c0 1.7-1.3 3-3 3h-12c-1.7 0-3-1.3-3-3v-13c0-1.7 1.3-3 3-3z"
        opacity="0.4"
      />
      <path fill="currentColor" d="M11.8 6L8 15.1h-.9L10.8 6h1z" />
    </svg>
  );
}

export function Header() {
  return (
    <header
      className={clsx(
        "app-header transition-content sticky top-0 z-20 flex h-[65px] shrink-0 items-center justify-between border-b border-base-300 bg-base-100/80 px-(--margin-x) backdrop-blur-sm backdrop-saturate-150",
      )}
    >
      <SidebarToggleBtn />

      <div className="flex items-center gap-2 ltr:-mr-1.5 rtl:-ml-1.5">
        <Search
          renderButton={(open) => (
            <>
              <Button
                onClick={open}
                unstyled
                className="h-8 w-64 justify-between gap-2 rounded-full border border-base-300 px-3 text-xs-plus hover:border-base-content/20 max-sm:hidden"
              >
                <div className="flex items-center gap-2">
                  <MagnifyingGlassIcon className="size-4" />
                  <span className="text-base-content/60">
                    Search here...
                  </span>
                </div>
                <SlashIcon />
              </Button>

              <Button
                onClick={open}
                variant="flat"
                isIcon
                className="relative size-9 rounded-full sm:hidden"
              >
                <SearchIcon className="size-6 text-base-content" />
              </Button>
            </>
          )}
        />
        <Notifications />
        <RightSidebar />
        <LanguageSelector />
      </div>
    </header>
  );
}

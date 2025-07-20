// Import Dependencies
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

// Local Imports
import { useThemeContext } from "app/contexts/theme/context";
import { Button } from "components/ui";
import { Menu } from "./Menu";

// ----------------------------------------------------------------------

export function PrimePanel({
  currentSegment,
  pathname,
  close,
}) {
  const { cardSkin } = useThemeContext();
  const { t } = useTranslation();

  const title = t(currentSegment?.transKey) || currentSegment?.title;

  return (
    <div
      className={clsx(
        "prime-panel flex h-full flex-col",
        cardSkin === "shadow"
          ? "shadow-lg"
          : "border-base-300 ltr:border-r rtl:border-l",
      )}
    >
      <div
        className={clsx(
          "flex h-full grow flex-col bg-base-100 ltr:pl-(--main-panel-width) rtl:pr-(--main-panel-width)",
          cardSkin === "shadow" ? "bg-base-100" : "bg-base-100",
        )}
      >
        <div className="relative flex h-16 w-full shrink-0 items-center justify-between pl-4 pr-1 rtl:pl-1 rtl:pr-4">
          <p className="truncate text-base tracking-wider text-base-content">
            {title}
          </p>
          <Button
            onClick={close}
            isIcon
            variant="flat"
            className="size-7 rounded-full xl:hidden"
          >
            <ChevronLeftIcon className="size-6 rtl:rotate-180" />
          </Button>
        </div>
        {currentSegment?.childs && (
          <Menu
            nav={currentSegment?.childs}
            pathname={pathname}
          />
        )}
      </div>
    </div>
  );
}

PrimePanel.propTypes = {
  currentSegment: PropTypes.object,
  close: PropTypes.func,
};

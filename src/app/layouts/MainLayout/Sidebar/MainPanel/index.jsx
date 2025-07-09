// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { Link } from "react-router";

// Local Imports
import { useThemeContext } from "app/contexts/theme/context";
import Logo from "assets/appLogo.svg?react";
import { Profile } from "../../Profile";
import { Menu } from "./Menu";

// ----------------------------------------------------------------------

export function MainPanel({ nav, setActiveSegment, activeSegment }) {
  const { cardSkin } = useThemeContext();
  return (
    <div className="main-panel">
      <div
        className={clsx(
          "flex h-full w-full flex-col items-center border-gray-150 bg-white dark:border-dark-600/80 ltr:border-r rtl:border-l",
          cardSkin === "shadow" ? "dark:bg-dark-750" : "dark:bg-dark-900",
        )}
      >
        {/* Application Logo */}
        <div className="flex pt-3.5">
          <Link to="/">
            <Logo className="size-10 text-primary-600 dark:text-primary-400" />
          </Link>
        </div>

        <Menu
          nav={nav}
          activeSegment={activeSegment}
          setActiveSegment={setActiveSegment}
        />

        {/* Bottom Profile */}
        <div className="flex flex-col items-center py-2.5">
          <Profile />
        </div>
      </div>
    </div>
  );
}

MainPanel.propTypes = {
  nav: PropTypes.array,
  setActiveSegment: PropTypes.func,
  activeSegment: PropTypes.string,
};

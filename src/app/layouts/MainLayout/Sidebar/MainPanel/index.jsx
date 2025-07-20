// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { Link } from "react-router";

// Local Imports
import Logo from "assets/appLogo.svg?react";
import { Profile } from "../../Profile";
import { Menu } from "./Menu";

// ----------------------------------------------------------------------

export function MainPanel({ nav, setActiveSegment, activeSegment }) {
  return (
    <div className="main-panel">
      <div
        className={clsx(
          "flex h-full w-full flex-col items-center border-base-300 bg-base-200 ltr:border-r rtl:border-l",
        )}
      >
        {/* Application Logo */}
        <div className="flex pt-3.5">
          <Link to="/">
            <Logo className="size-10 text-primary" />
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

// Import Dependencies
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

// Local Imports
import { navigation } from "app/navigation";
import { NAV_TYPE_ITEM } from "constants/app.constant";
import { isRouteActive } from "utils/isRouteActive";

// ----------------------------------------------------------------------

export function MobileBottomNav() {
    const { pathname } = useLocation();
    const { t } = useTranslation();

    // Filter navigation to show only the most important items on mobile
    // You can customize this to show different items or all items
    const mobileNavItems = navigation.filter(item =>
        ['home', 'overview', 'transactions', 'calendar', 'budget-settings'].includes(item.id)
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 safe-area-pb">
            <div className="flex items-center justify-around px-2 py-1">
                {mobileNavItems.map(({ id, path, Icon, title, transKey, type }) => {
                    const isActive = isRouteActive(path, pathname);
                    const isLink = type === NAV_TYPE_ITEM;
                    const label = t(transKey) || title;

                    const Element = isLink ? Link : "button";
                    const elementProps = isLink ? { to: path } : {};

                    return (
                        <Element
                            key={id}
                            {...elementProps}
                            className={clsx(
                                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors duration-200",
                                isActive
                                    ? "text-primary-600 dark:text-primary-400"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            )}
                        >
                            {Icon && (
                                <Icon
                                    className={clsx(
                                        "mb-1 transition-all duration-200",
                                        isActive ? "size-6" : "size-5"
                                    )}
                                />
                            )}
                            <span
                                className={clsx(
                                    "text-xs font-medium truncate max-w-full transition-all duration-200",
                                    isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"
                                )}
                            >
                                {label}
                            </span>
                        </Element>
                    );
                })}
            </div>
        </nav>
    );
}

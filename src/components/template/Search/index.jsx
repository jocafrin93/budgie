// Import Dependencies
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import { Fragment, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Link } from "react-router";
import invariant from "tiny-invariant";

// Local Imports
import { useThemeContext } from "app/contexts/theme/context";
import { navigation } from "app/navigation";
import { settings } from "app/navigation/settings";
import { Highlight } from "components/shared/Highlight";
import { Button, Input } from "components/ui";
import { NAV_TYPE_COLLAPSE } from "constants/app.constant";
import { useDisclosure, useFuse } from "hooks";
import { createScopedKeydownHandler } from "utils/dom/createScopedKeydownHandler";

// ----------------------------------------------------------------------

const data = flattenNav([...navigation, settings]);

export function Search({ renderButton }) {
  const [isOpen, { open, close }] = useDisclosure(false);

  useHotkeys("/", () => open(), {
    ignoreModifiers: true,
    preventDefault: true,
  })

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden sm:px-5 sm:py-6"
          onClose={close}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          </TransitionChild>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative flex h-full w-full max-w-lg origin-bottom flex-col bg-base-100 transition-all duration-300 bg-base-100 sm:max-h-[600px] sm:rounded-lg">
              <SearchDialog isOpen={isOpen} close={close} />
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      {renderButton ? renderButton(open) : null}
    </>
  );
}

export function SearchDialog({ close }) {
  const { isDark } = useThemeContext();
  const searchRef = useRef(null);
  const { result, query, setQuery } = useFuse(data, {
    keys: ["title"],
    threshold: 0.2,
    matchAllOnEmptyQuery: false,
  });

  useEffect(() => {
    invariant(searchRef.current, "searchRef is not assigned");
    searchRef.current.focus();
  }, []);

  return (
    <div data-search-wrapper className="flex flex-col overflow-hidden">
      <div className="rounded-t-lg bg-base-300 py-2 bg-base-100 lg:py-3">
        <div className="flex items-center justify-between pl-2 pr-4 rtl:pl-4 rtl:pr-2">
          <Input
            ref={searchRef}
            placeholder="Search here..."
            value={query}
            data-search-item
            onChange={(event) => setQuery(event.target.value)}
            classNames={{ root: "flex-1", input: "border-none" }}
            prefix={<MagnifyingGlassIcon className="size-5" />}
            onKeyDown={createScopedKeydownHandler({
              siblingSelector: "[data-search-item]",
              parentSelector: "[data-search-wrapper]",
              activateOnFocus: false,
              loop: true,
              orientation: "vertical",
            })}
          />
          <Button
            onClick={close}
            variant={isDark ? "filled" : "outlined"}
            className="px-3 py-1.5 text-xs"
          >
            ESC
          </Button>
        </div>
      </div>

      {result.length === 0 && query !== "" && (
        <div className="flex flex-col overflow-y-auto py-4">
          <h3 className="px-4 text-base-content sm:px-5">
            No Result Found
          </h3>
        </div>
      )}

      {result.length > 0 && (
        <div className="flex flex-col overflow-y-auto py-4">
          <h3 className="px-4 text-base-content sm:px-5">
            Search Result
          </h3>
          <div className="space-y-3 px-4 pt-3">
            {result.map(({ item, refIndex }) => (
              <Link
                key={refIndex}
                onKeyDown={createScopedKeydownHandler({
                  siblingSelector: "[data-search-item]",
                  parentSelector: "[data-search-wrapper]",
                  activateOnFocus: false,
                  loop: true,
                  orientation: "vertical",
                })}
                data-search-item
                to={item.path}
                className="group flex items-center justify-between space-x-2 rounded-lg bg-base-200 px-2.5 py-2 tracking-wide text-base-content outline-hidden transition-all focus:border-primary bg-base-100 text-base-content "
                onClick={close}
              >
                <div className="min-w-0">
                  <span className="truncate">
                    <Highlight query={query}>{item.title}</Highlight>
                  </span>
                </div>

                <ChevronRightIcon className="size-4.5 rtl:rotate-180" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function flattenNav(items) {
  let flatArray = [];
  items.forEach((item) => {
    if (item.path && item.type !== NAV_TYPE_COLLAPSE) {
      // eslint-disable-next-line no-unused-vars
      const { type, transKey, ...filteredItem } = item;
      flatArray.push(filteredItem);
    }
    if (item.childs) {
      flatArray = flatArray.concat(flattenNav(item.childs));
    }
  });
  return flatArray;
}

Search.propTypes = {
  renderButton: PropTypes.func,
};

SearchDialog.propTypes = {
  isOpen: PropTypes.bool,
  close: PropTypes.func,
};

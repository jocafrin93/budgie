// Import Dependencies
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import PropTypes from "prop-types";
import { useEffect, useRef } from "react";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { Badge, Button, Checkbox, Input } from "components/ui";
import { useFuse } from "hooks";
import { ResponsiveFilter } from "./ResponsiveFilter";

// ----------------------------------------------------------------------

export function FilterSelector({ table, options }) {
  const selectedFiltersLength = table?.getState()?.toolbarFilters?.length;

  return (
    <ResponsiveFilter
      buttonContent={
        <>
          <FunnelIcon className="size-4" />
          <span> Filter </span>

          {selectedFiltersLength > 0 && (
            <>
              <div className="h-full w-px bg-base-300 bg-base-200" />
              <Badge>{selectedFiltersLength}</Badge>
            </>
          )}
        </>
      }
    >
      <Content
        {...{
          table,
          options,
        }}
      />
    </ResponsiveFilter>
  );
}

function Content({ table, options }) {
  const selectedValues = table?.getState()?.toolbarFilters || [];
  const inputRef = useRef();
  const { smAndUp } = useBreakpointsContext();

  const {
    result: filteredItems,
    query,
    setQuery,
  } = useFuse(options, {
    keys: ["label"],
    threshold: 0.2,
    matchAllOnEmptyQuery: true,
  });

  useEffect(() => {
    smAndUp && inputRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Combobox
      value={selectedValues.map((value) =>
        options.find((obj) => obj.value === value),
      )}
      onChange={(list) => {
        table?.options?.meta?.setToolbarFilters(list.map((item) => item.value));
      }}
      multiple
      className="sm:w-56"
    >
      <div className="relative">
        <div className="relative bg-base-200 py-1 bg-base-100">
          <ComboboxInput
            as={Input}
            className="border-none"
            ref={inputRef}
            autoComplete="new"
            placeholder="Select Filters"
            displayValue={({ name }) => name}
            onChange={(event) => setQuery(event.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
          />
        </div>

        <ComboboxOptions
          static
          className="max-h-72 w-full overflow-y-auto py-1 outline-hidden"
        >
          {filteredItems.length === 0 && query !== "" ? (
            <div className="relative cursor-default select-none px-2.5 py-2 text-base-content text-base-content">
              Nothing found for {query}
            </div>
          ) : (
            filteredItems.map(({ item, refIndex }) => (
              <ComboboxOption
                key={refIndex}
                className={({ focused }) =>
                  clsx(
                    "relative cursor-pointer select-none px-2.5 py-2 text-base-content outline-hidden transition-colors text-base-content",
                    focused focused focused focused focus:border-primary &&focus:border-primary &&focused focus:border-primary &&focus:border-primary &&focused focus:border-primary &&focus:border-primary &&focused focus:border-primary &&focus:border-primary &&focused focused focused focus:border-primary &&focus:border-primary &&focused focus:border-primary &&focus:border-primary &&focused focus:border-primary &&focus:border-primary &&focused focus:border-primary &&focus:border-primary && "bg-base-200",
                  )
                }
                value={item}
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex min-w-0 items-center space-x-2">
                      <Checkbox checked={selected} readOnly />
                      {item.icon && <item.icon className="size-4.5 stroke-1" />}

                      <span className="block truncate text-xs-plus">
                        {item.label}
                      </span>
                    </div>
                  </div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
        {selectedValues?.length > 0 && (
          <Button
            onClick={() => table?.options?.meta?.setToolbarFilters([])}
            className="w-full rounded-none"
          >
            Clear Filter
          </Button>
        )}
      </div>
    </Combobox>
  );
}

FilterSelector.propTypes = {
  table: PropTypes.object,
  options: PropTypes.array,
};

Content.propTypes = {
  table: PropTypes.object,
  options: PropTypes.array,
};

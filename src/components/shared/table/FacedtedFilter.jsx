// Import Dependencies
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import PropTypes from "prop-types";
import { useEffect, useRef } from "react";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { Badge, Button, Checkbox, Input } from "components/ui";
import { useFuse } from "hooks";
import { ResponsiveFilter } from "./ResponsiveFilter";

// ----------------------------------------------------------------------

export function FacedtedFilter({
  column,
  title,
  options,
  labelField = "label",
  valueField = "value",
  Icon,
  renderPrefix,
  showCheckbox = true,
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => column?.setFilterValue(undefined), []);

  const selectedValues = column?.getFilterValue() || [];
  const selectedItems = options?.filter((o) =>
    selectedValues.includes(o[valueField]),
  );

  return (
    <ResponsiveFilter
      buttonContent={
        <>
          {Icon && <Icon className="size-4" />}

          <span>{title}</span>

          {selectedItems?.length > 0 && (
            <>
              <div className="h-full w-px bg-base-300 bg-base-200" />
              <Badge className="lg:hidden">{selectedItems.length}</Badge>

              {selectedItems.length > 2 ? (
                <Badge className="max-lg:hidden">
                  {selectedItems.length} selected
                </Badge>
              ) : (
                <div className="hidden gap-1 lg:flex">
                  {selectedItems.map((val) => (
                    <Badge key={val[valueField]} className="gap-1">
                      {val.icon && <val.icon className="size-4 stroke-1" />}
                      <span>{val[labelField]}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      }
    >
      <ComboboxFilter
        {...{
          column,
          title,
          options,
          labelField,
          valueField,
          renderPrefix,
          showCheckbox,
        }}
      />
    </ResponsiveFilter>
  );
}

function ComboboxFilter({
  column,
  title,
  options,
  labelField,
  valueField,
  renderPrefix,
  showCheckbox,
}) {
  const inputRef = useRef();
  const {
    result: filteredItems,
    query,
    setQuery,
  } = useFuse(options, {
    keys: [labelField],
    threshold: 0.2,
    matchAllOnEmptyQuery: true,
  });

  const { smAndUp } = useBreakpointsContext();
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = column?.getFilterValue() || [];

  useEffect(() => {
    smAndUp && inputRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Combobox
      value={options?.filter((o) => selectedValues.includes(o[valueField]))}
      onChange={(list) => {
        column.setFilterValue(list.map((item) => item[valueField]));
      }}
      multiple
      className="h-[366px] sm:h-auto sm:max-h-80 sm:w-56"
    >
      <div className="relative flex flex-col">
        <div className="relative bg-base-200 py-1 bg-base-100">
          <ComboboxInput
            as={Input}
            className="border-none"
            ref={inputRef}
            autoComplete="new"
            placeholder={title}
            displayValue={({ name }) => name}
            onChange={(event) => setQuery(event.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
          />
        </div>

        <ComboboxOptions
          static
          className="h-auto w-full overflow-y-auto py-1 outline-hidden"
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
                    focused && "bg-base-200",
                  )
                }
                value={item}
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {showCheckbox && <Checkbox checked={selected} readOnly />}
                      {item.icon && <item.icon className="size-4.5 stroke-1" />}
                      {renderPrefix && renderPrefix(item, selected)}
                      <span className="block truncate text-xs-plus">
                        {item[labelField]}
                      </span>
                    </div>
                    <span className="font-mono text-xs">
                      {facets?.get(item[valueField])}
                    </span>
                  </div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
        {selectedValues?.length > 0 && (
          <Button
            onClick={() => column?.setFilterValue(undefined)}
            className="w-full shrink-0 rounded-none"
          >
            Clear Filter
          </Button>
        )}
      </div>
    </Combobox>
  );
}

FacedtedFilter.propTypes = {
  column: PropTypes.object,
  title: PropTypes.string,
  labelField: PropTypes.string,
  valueField: PropTypes.string,
  options: PropTypes.array,
  Icon: PropTypes.elementType,
  renderPrefix: PropTypes.func,
  showCheckbox: PropTypes.bool,
};

ComboboxFilter.propTypes = {
  column: PropTypes.object,
  title: PropTypes.string,
  labelField: PropTypes.string,
  valueField: PropTypes.string,
  options: PropTypes.array,
  renderPrefix: PropTypes.func,
  showCheckbox: PropTypes.bool,
};

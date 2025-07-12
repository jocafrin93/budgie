// Import Dependencies
import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import PropTypes from "prop-types";
import { forwardRef, Fragment } from "react";

// Local Imports
import { Input } from "components/ui";

// ----------------------------------------------------------------------

const CustomListbox = forwardRef(
  (
    {
      data,
      placeholder,
      label,
      displayField = "label",
      error,
      multiple,
      inputProps,
      rootProps,
      className,
      classNames,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        className={clsx(
          "flex flex-col [&_.suffix]:pointer-events-none",
          classNames?.root,
        )}
        {...rootProps}
      >
        <Listbox
          as="div"
          multiple={multiple}
          className={(className, classNames?.listbox)}
          ref={ref}
          {...rest}
        >
          {({ open, value: selectedValue }) => (
            <>
              {label && <Label>{label}</Label>}

              <div className={clsx("relative", label && "mt-1.5")}>
                <ListboxButton
                  as={Input}
                  component="button"
                  type="button"
                  error={error}
                  suffix={
                    <ChevronDownIcon
                      className={clsx(
                        "size-5 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  }
                  {...inputProps}
                >
                  <span className="block truncate">
                    <span className="text-base-content/70">
                      {!selectedValue?.[multiple ? "length" : displayField] &&
                        placeholder}
                    </span>
                    <span>
                      {multiple
                        ? selectedValue
                          .map((item) => item[displayField])
                          .join(", ")
                        : selectedValue?.[displayField]}
                    </span>
                  </span>
                </ListboxButton>
                <Transition
                  as={Fragment}
                  enter="transition ease-out"
                  enterFrom="opacity-0 translate-y-2"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-2"
                >
                  <ListboxOptions
                    anchor={{ to: "bottom end", gap: 8 }}
                    className="absolute z-100 max-h-60 w-full overflow-auto rounded-lg border border-base-300 bg-base-100 py-1 shadow-lg shadow-gray-200/50 outline-hidden focus:outline-none bg-base-200"
                  >
                    {data.map((item, i) => (
                      <ListboxOption
                        key={i}
                        className={({ selected, focused }) =>
                          clsx(
                            "relative cursor-pointer select-none py-2 pl-4 pr-10 outline-hidden transition-colors rtl:pl-10 rtl:pr-4",
                            focused &&
                            !selected &&
                            "bg-base-200",
                            selected
                              ? "bg-primary text-white"
                              : "text-base-content",
                          )
                        }
                        value={item}
                      >
                        {({ selected }) => (
                          <>
                            <span className="block truncate">
                              {item[displayField]}
                            </span>

                            {selected ? (
                              <span className="absolute inset-y-0 flex items-center ltr:right-0 ltr:pr-3 rtl:left-0 rtl:pl-3">
                                <CheckIcon
                                  className="size-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      </div>
    );
  },
);

CustomListbox.displayName = "Listbox";

CustomListbox.propTypes = {
  data: PropTypes.array,
  placeholder: PropTypes.node,
  label: PropTypes.node,
  displayField: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.node]),
  multiple: PropTypes.bool,
  inputProps: PropTypes.object,
  rootProps: PropTypes.object,
  classNames: PropTypes.object,
  className: PropTypes.string,
};

export { CustomListbox as Listbox };


// Import Dependencies
import { DocumentTextIcon, XMarkIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";

// Local Imports
import { Button } from "components/ui";

// ----------------------------------------------------------------------

export function FileItemSquare({ file, handleRemove, ...rest }) {
  const { type, name } = file;
  const isImage = type.split("/")[0] === "image";

  return (
    <div
      title={name}
      className="group relative aspect-square size-20 rounded-lg ring-primary-600 ring-offset-4 ring-offset-white transition-all hover"
      {...rest}
    >
      {isImage ? (
        <img
          className="h-full w-full object-contain"
          src={URL.createObjectURL(file)}
          alt={name}
        />
      ) : (
        <div className="h-full w-full select-none rounded-lg bg-base-200 px-1 py-2 text-center bg-base-100">
          <DocumentTextIcon className="m-auto size-8 text-base-content/60" />
          <span className="mt-1.5 line-clamp-2 text-tiny">{name}</span>
        </div>
      )}
      <div className="absolute -right-3 -top-4 flex items-center justify-center rounded-full bg-base-100 opacity-0 transition-opacity group-hover:opacity-100 bg-base-100">
        <Button
          onClick={handleRemove}
          className="size-6 shrink-0 rounded-full border p-0"
        >
          <XMarkIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

FileItemSquare.propTypes = {
  file: PropTypes.object,
  handleRemove: PropTypes.func,
};

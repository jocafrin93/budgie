// Import Dependencies
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  DocumentTextIcon,
  FilmIcon,
  MusicalNoteIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import PropTypes from "prop-types";

// Local Imports
import { Button } from "components/ui";
import { formatBytes } from "utils/formatBytes";

// ----------------------------------------------------------------------

function mediaIcon(media) {
  if (media === "image") return PhotoIcon;
  if (media === "video") return FilmIcon;
  if (media === "audio") return MusicalNoteIcon;
  return DocumentTextIcon;
}

export function FileItem({ file, handleRemove, ...rest }) {
  const { type, name, size } = file;
  const Icon = mediaIcon(type.split("/")[0]);
  return (
    <div
      className="flex w-full items-center justify-between rounded-lg border border-base-300 p-3 md:p-4"
      {...rest}
    >
      <div className="mr-2 flex min-w-0 items-center space-x-2 ">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-base-200 text-base-content/60 bg-base-100text-base-content/60">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base-content text-base-content">{name}</p>
          <p className="mt-1 text-xs text-base-content/60">
            {formatBytes(size)}
          </p>
        </div>
      </div>
      <Button
        onClick={handleRemove}
        variant="flat"
        className="-mr-1 size-7 shrink-0 p-0"
      >
        <TrashIcon className="size-4.5" />
      </Button>
    </div>
  );
}

FileItem.propTypes = {
  file: PropTypes.object,
  handleRemove: PropTypes.func,
};

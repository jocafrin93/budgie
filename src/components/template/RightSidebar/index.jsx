// Import Dependencies
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import PropTypes from "prop-types";

// Local Imports
import VerticalSliderIcon from "assets/dualicons/vertical-slider.svg?react";
import { Button, ScrollShadow } from "components/ui";
import { useDisclosure } from "hooks";
import { Header } from "./Header";

// ----------------------------------------------------------------------

export function RightSidebar() {
  const [isOpen, { open, close }] = useDisclosure();

  return (
    <>
      <Button
        onClick={open}
        variant="flat"
        isIcon
        className="relative size-9 rounded-full"
      >
        <VerticalSliderIcon className="size-6" />
      </Button>
      <RightSidebarContent isOpen={isOpen} close={close} />
    </>
  );
}

function RightSidebarContent({ isOpen, close }) {
  return (
    <Transition show={isOpen}>
      <Dialog open={true} onClose={close} static autoFocus>
        <TransitionChild
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm transition-opacity"
        ></TransitionChild>

        <TransitionChild
          as={DialogPanel}
          enter="ease-out transform-gpu transition-transform duration-200"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
          className="fixed inset-y-0 right-0 z-61 flex w-screen transform-gpu flex-col bg-base-100 transition-transform duration-200 bg-base-200 sm:inset-y-2 sm:mx-2 sm:w-80 sm:rounded-xl"
        >
          <Header close={close} />
          <ScrollShadow
            size={4}
            className="hide-scrollbar overflow-y-auto overscroll-contain pb-5"
          >
            <div className="px-4 italic">Start magic form here</div>
          </ScrollShadow>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

RightSidebarContent.propTypes = {
  isOpen: PropTypes.bool,
  close: PropTypes.func,
};

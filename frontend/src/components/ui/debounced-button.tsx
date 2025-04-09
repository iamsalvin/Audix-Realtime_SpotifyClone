import { forwardRef } from "react";
import { Button, ButtonProps } from "./button";
import { useDebounceClick } from "@/hooks/useDebounceClick";

export interface DebouncedButtonProps extends ButtonProps {
  onClickDebounced?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  debounceDelay?: number;
  threshold?: number;
}

/**
 * Enhanced Button component with debounced click handling to prevent accidental
 * double-clicks or rapid multiple clicks. This makes buttons more reliable, especially
 * for operations that shouldn't be triggered multiple times.
 */
const DebouncedButton = forwardRef<HTMLButtonElement, DebouncedButtonProps>(
  (
    {
      onClickDebounced,
      onClick,
      debounceDelay = 200,
      threshold = 300,
      ...props
    },
    ref
  ) => {
    // Prioritize the debounced click handler if provided
    const clickHandler = onClickDebounced || onClick;

    // Use the debounce hook for click handling
    const handleClick = useDebounceClick(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (clickHandler) {
          clickHandler(e);
        }
      },
      debounceDelay,
      threshold
    );

    return (
      <Button
        ref={ref}
        {...props}
        onClick={handleClick}
        className={`hover:scale-105 active:scale-95 transition-transform ${
          props.className || ""
        }`}
      />
    );
  }
);

DebouncedButton.displayName = "DebouncedButton";

export { DebouncedButton };

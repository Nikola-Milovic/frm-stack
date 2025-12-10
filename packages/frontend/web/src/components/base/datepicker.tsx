import { ChevronDownIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { Button } from "#components/base/button";
import { Calendar } from "#components/base/calendar";
import { Label } from "#components/base/label";
import { Popover, PopoverContent, PopoverTrigger } from "#components/base/popover";
import { formatDate } from "#lib/date-utils";

export type DatePickerProps = {
  id: string;
  name?: string;
  ariaLabel?: string;
  dataTestId?: string;
  label?: string;
  // Controlled mode
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  // Uncontrolled mode (for forms)
  defaultValue?: string | Date | undefined;
  // Format date string for form submission (YYYY-MM-DD)
  formatDateForForm?: (date: Date) => string;
};

const defaultFormatDateForForm = (date: Date): string => {
  // ISO string is always `YYYY-MM-DDTHH:mm:ss.sssZ`
  return date.toISOString().slice(0, 10);
};

export function DatePicker({
  id,
  name,
  ariaLabel,
  dataTestId,
  label,
  value: controlledValue,
  onChange: controlledOnChange,
  defaultValue,
  formatDateForForm = defaultFormatDateForForm,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<Date | undefined>(() => {
    if (controlledValue !== undefined) {
      return controlledValue;
    }
    if (defaultValue) {
      return typeof defaultValue === "string" ? new Date(defaultValue) : defaultValue;
    }
    return undefined;
  });
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Update internal value when controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Update hidden input when value changes (for form submission)
  useEffect(() => {
    if (hiddenInputRef.current && internalValue) {
      hiddenInputRef.current.value = formatDateForForm(internalValue);
    } else if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
    }
  }, [internalValue, formatDateForForm]);

  const isControlled = controlledValue !== undefined && controlledOnChange !== undefined;
  const displayValue = isControlled ? controlledValue : internalValue;

  // Determine locale for date formatting
  const dateLocale = "en-US";
  const formatDisplayDate = (date: Date): string => {
    return formatDate(date, dateLocale);
  };

  const handleSelect = (date: Date | undefined) => {
    if (isControlled) {
      controlledOnChange?.(date);
    } else {
      setInternalValue(date);
    }
    setOpen(false);
  };

  return (
    <div id={id} data-testid={dataTestId} className="flex flex-col gap-2">
      {label && (
        <Label htmlFor={`${id}-trigger`} className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={`${id}-trigger`}
            className="w-full justify-between font-normal"
            aria-label={ariaLabel}
          >
            {displayValue ? formatDisplayDate(displayValue) : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar mode="single" selected={displayValue} captionLayout="dropdown" onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
      {name && <input ref={hiddenInputRef} type="hidden" name={name} id={`${id}-hidden`} />}
    </div>
  );
}

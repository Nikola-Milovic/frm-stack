import * as React from "react";
import Fuse from "fuse.js";
import type * as FuseTypes from "fuse.js";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { VirtualItem } from "@tanstack/react-virtual";

import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";

import { cn, truncateString } from "#lib/utils";
import { Button } from "#components/base/button";
import { Popover, PopoverContent, PopoverTrigger } from "#components/base/popover";

export type ComboboxOption = {
  id: string;
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
  hidden?: boolean;
};

type ComboboxProps = {
  triggerId: string;
  inputId: string;
  dataTestId: string;
  options: ComboboxOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  selectedValue?: string | null;
  onSelect: (option: ComboboxOption | null) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  fuseKeys?: Array<FuseTypes.FuseOptionKey<ComboboxOption>>;
};

const DEFAULT_FUSE_KEYS: Array<FuseTypes.FuseOptionKey<ComboboxOption>> = [
  { name: "serialNumber", weight: 0.7 },
  { name: "label", weight: 0.3 },
  { name: "keywords", weight: 0.2 },
];

const DEFAULT_FUSE_OPTIONS: FuseTypes.IFuseOptions<ComboboxOption> = {
  keys: DEFAULT_FUSE_KEYS,
  threshold: 0.35,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 1,
  shouldSort: true,
};

function sanitizeForTestId(value: string): string {
  if (!value) return "option";
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") || "option"
  );
}

// Virtual list item component
const VirtualListItem = React.memo(
  ({
    option,
    isSelected,
    onSelect,
    testId,
    itemId,
  }: {
    option: ComboboxOption;
    isSelected: boolean;
    onSelect: (value: string) => void;
    testId: string;
    itemId: string;
  }) => {
    return (
      <div
        id={itemId}
        data-testid={testId}
        role="option"
        aria-selected={isSelected}
        aria-label={option.label}
        onClick={() => onSelect(option.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(option.value);
          }
        }}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
          "hover:bg-accent hover:text-accent-foreground",
          "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground",
        )}
        data-selected={isSelected}
        tabIndex={-1}
      >
        <CheckIcon className={cn("mr-2 h-4 w-4 flex-shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-medium leading-tight truncate">{option.label}</span>
          {option.description ? (
            <span className="text-xs text-muted-foreground truncate">{option.description}</span>
          ) : null}
        </div>
      </div>
    );
  },
);

export function Combobox({
  triggerId,
  inputId,
  dataTestId,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  selectedValue,
  onSelect,
  disabled = false,
  ariaLabel,
  className,
  fuseKeys,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [isContainerReady, setIsContainerReady] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === selectedValue) ?? null,
    [options, selectedValue],
  );

  const visibleOptions = React.useMemo(() => options.filter((option) => !option.hidden), [options]);

  // Track when container is mounted
  const containerRefCallback = React.useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    if (node) {
      setIsContainerReady(true);
    }
  }, []);

  const fuse = React.useMemo(() => {
    if (visibleOptions.length === 0) {
      return null;
    }
    const fuseOptions: FuseTypes.IFuseOptions<ComboboxOption> = {
      ...DEFAULT_FUSE_OPTIONS,
      keys: fuseKeys?.length ? fuseKeys : DEFAULT_FUSE_KEYS,
    };
    return new Fuse(visibleOptions, fuseOptions);
  }, [visibleOptions, fuseKeys]);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) {
      return visibleOptions;
    }
    if (!fuse) {
      return visibleOptions;
    }
    return fuse.search(searchValue).map((result: FuseTypes.FuseResult<ComboboxOption>) => result.item);
  }, [fuse, visibleOptions, searchValue]);

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: React.useCallback(
      (index: number) => {
        const option = filteredOptions[index];
        // More accurate estimation: base height + description height if present
        return option?.description ? 56 : 36;
      },
      [filteredOptions],
    ),
    overscan: 5,
    enabled: isContainerReady,
  });

  // Force virtualizer to measure when container becomes ready
  React.useLayoutEffect(() => {
    if (isContainerReady && open) {
      rowVirtualizer.measure();
    }
  }, [isContainerReady, open, rowVirtualizer]);

  // Reset container ready state when closing
  React.useEffect(() => {
    if (!open) {
      setIsContainerReady(false);
    }
  }, [open]);

  const handleSelect = React.useCallback(
    (currentValue: string) => {
      const option = options.find((item) => item.value === currentValue) ?? null;
      const nextValue = option && option.value === selectedValue ? null : option;
      onSelect(nextValue);
      setOpen(false);
      setSearchValue("");
    },
    [options, selectedValue, onSelect],
  );

  const isDisabled = disabled || visibleOptions.length === 0;

  const virtualItems = isContainerReady ? rowVirtualizer.getVirtualItems() : [];

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearchValue("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={triggerId}
          data-testid={`${dataTestId}-trigger`}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn("w-full justify-between", className)}
          disabled={isDisabled}
        >
          <span className="truncate text-left">
            {selectedOption ? truncateString(`${selectedOption.label}`, 100) : placeholder}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <div className="flex flex-col bg-popover text-popover-foreground">
          <div className="flex h-9 items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <input
              id={inputId}
              data-testid={`${dataTestId}-input`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {filteredOptions.length === 0 ? (
            <div data-testid={`${dataTestId}-empty`} className="py-6 text-center text-sm">
              {emptyLabel}
            </div>
          ) : (
            <div
              ref={containerRefCallback}
              data-testid={`${dataTestId}-list`}
              className="max-h-[400px] overflow-auto p-1"
              role="listbox"
            >
              {isContainerReady && (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                    minHeight: "1px",
                  }}
                >
                  {virtualItems.map((virtualRow: VirtualItem) => {
                    const option = filteredOptions[virtualRow.index];
                    if (!option) return null;

                    const isSelected = selectedOption?.value === option.value;
                    const optionTestId = `${dataTestId}-option-${sanitizeForTestId(option.id)}`;
                    const optionId = `${triggerId}Option${virtualRow.index}`;

                    return (
                      <div
                        key={option.value}
                        data-index={virtualRow.index}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <VirtualListItem
                          option={option}
                          isSelected={isSelected}
                          onSelect={handleSelect}
                          testId={optionTestId}
                          itemId={optionId}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

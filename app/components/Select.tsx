"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export default function Select({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const id = useId();
  const listId = `${id}-list`;
  const labelId = `${id}-label`;

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];
  const mounted = open || closing;

  function openList(startIndex = selectedIndex) {
    setActiveIndex(startIndex);
    setClosing(false);
    setOpen(true);
  }

  function closeList({ focusTrigger = true } = {}) {
    if (!open) return;
    setOpen(false);
    setClosing(true);
    if (focusTrigger) buttonRef.current?.focus();
  }

  function pick(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    closeList();
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setClosing(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openList();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openList(options.length - 1);
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        pick(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        closeList();
        break;
      case "Tab":
        closeList({ focusTrigger: false });
        break;
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "vh-selecttrigger w-full inline-flex items-center justify-between gap-3.5 bg-vh-card border rounded-vh-10 py-2.5 pl-4 pr-3.5 text-white font-semibold text-vh-12-5 font-space-grotesk outline-none cursor-pointer [transition:border-color_.15s,background_.15s]",
          open ? "border-vh-violet" : "border-vh-border",
        )}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg
          viewBox="0 0 10 6"
          width="10"
          height="6"
          aria-hidden="true"
          className={cn(
            "vh-select-chevron shrink-0 text-vh-muted [transition:transform_.18s_ease,color_.15s]",
            open && "rotate-180 text-vh-accent",
          )}
        >
          <path
            d="M1 1l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {mounted && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={`${id}-opt-${activeIndex}`}
          onKeyDown={onListKeyDown}
          onAnimationEnd={() => setClosing(false)}
          className={cn(
            "absolute top-[calc(100%+6px)] right-0 z-70 m-0 min-w-full max-h-72 overflow-y-auto list-none p-1.5 bg-vh-card border border-vh-violet rounded-xl shadow-vh-dropdown outline-none",
            open ? "vh-select-panel-in" : "vh-select-panel-out",
          )}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                data-active={isActive}
                onPointerEnter={() => setActiveIndex(i)}
                onClick={() => pick(i)}
                className={cn(
                  "flex items-center justify-between gap-4 py-2.5 px-3 rounded-vh-7 cursor-pointer whitespace-nowrap font-semibold text-vh-12-5 font-space-grotesk [transition:background_.12s,color_.12s]",
                  isSelected ? "text-vh-lime" : "text-vh-soft",
                  isActive ? "bg-vh-deep text-white" : "",
                  isActive && isSelected && "text-vh-lime",
                )}
              >
                {o.label}
                <span className={cn("text-vh-lime text-vh-11", isSelected ? "opacity-100" : "opacity-0")} aria-hidden="true">
                  ✓
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

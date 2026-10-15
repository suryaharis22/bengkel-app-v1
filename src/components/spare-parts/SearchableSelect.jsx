"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

export default function SearchableSelect({
  id,
  value,
  onChange,
  endpoint,
  placeholder = "Search...",
  disabled = false,
  error = false,
  initialOptions = [],
  selectedLabel = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState(initialOptions);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  const normalizedValue =
    value === null || value === undefined ? "" : String(value);

  useEffect(() => {
    setOptions((current) => {
      const merged = [...initialOptions, ...current];
      return merged.filter(
        (item, index, all) =>
          all.findIndex(
            (candidate) => String(candidate.id) === String(item.id),
          ) === index,
      );
    });
  }, [initialOptions]);

  useEffect(() => {
    if (!normalizedValue) {
      setSelected(null);
      return;
    }

    const match = options.find((item) => String(item.id) === normalizedValue);
    if (match) {
      setSelected(match);
    } else {
      setSelected((current) => {
        if (current && String(current.id) === normalizedValue) return current;
        if (selectedLabel) return { id: normalizedValue, name: selectedLabel };
        return {
          id: normalizedValue,
          name: `Selected item (#${normalizedValue})`,
        };
      });
    }
  }, [normalizedValue, options, selectedLabel]);

  useEffect(() => {
    if (!isOpen || disabled) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setRequestError("");

      try {
        const params = new URLSearchParams({
          page: "1",
          per_page: "10",
          search: query.trim(),
        });
        const response = await fetch(`${endpoint}?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const result = await response.json();
        if (!result?.success || !Array.isArray(result?.data)) {
          throw new Error(result?.message || "Invalid API response.");
        }

        setOptions((current) => {
          const selectedOption = current.find(
            (item) => String(item.id) === normalizedValue,
          );
          const merged = selectedOption
            ? [...result.data, selectedOption]
            : result.data;
          return merged.filter(
            (item, index, all) =>
              all.findIndex(
                (candidate) => String(candidate.id) === String(item.id),
              ) === index,
          );
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setRequestError(error.message || "Failed to load options.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query, endpoint, disabled, initialOptions]);

  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 10);
    return options
      .filter(
        (item) =>
          String(item.name || "")
            .toLowerCase()
            .includes(q) ||
          String(item.slug || "")
            .toLowerCase()
            .includes(q),
      )
      .slice(0, 10);
  }, [options, query]);

  function chooseOption(option) {
    setSelected(option);
    onChange(String(option.id));
    setIsOpen(false);
    setQuery("");
    setRequestError("");
  }

  function clearSelection(event) {
    event.stopPropagation();
    setSelected(null);
    onChange("");
  }

  return (
    <div id={id} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
            setQuery("");
          }
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
            : "border-gray-300 focus:border-red-600 focus:ring-red-100"
        }`}
      >
        <span
          className={`truncate ${selected ? "pr-10 text-gray-900" : "text-gray-400"}`}
        >
          {selected?.name || placeholder}
        </span>
        <ChevronDown size={16} className="shrink-0 text-gray-400" />
      </button>
      {selected && !disabled && (
        <button
          type="button"
          aria-label="Clear selection"
          onClick={clearSelection}
          className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={14} />
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 top-full z-[70] mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-2.5 focus-within:border-red-500">
              {loading ? (
                <Loader2 size={15} className="animate-spin text-gray-400" />
              ) : (
                <Search size={15} className="text-gray-400" />
              )}
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-gray-400 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div role="listbox" className="max-h-56 overflow-y-auto p-1">
            {requestError ? (
              <p className="px-3 py-3 text-xs text-red-600">{requestError}</p>
            ) : loading && visibleOptions.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-500">
                Loading options...
              </p>
            ) : visibleOptions.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-500">
                No results found.
              </p>
            ) : (
              visibleOptions.map((option) => {
                const active = String(option.id) === normalizedValue;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => chooseOption(option)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {option.name}
                      </span>
                      {option.slug && (
                        <span className="mt-0.5 block truncate text-xs text-gray-400">
                          {option.slug}
                        </span>
                      )}
                    </span>
                    {active && <Check size={16} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 text-[11px] text-gray-400">
            Showing up to 10 results
          </div>
        </div>
      )}
    </div>
  );
}

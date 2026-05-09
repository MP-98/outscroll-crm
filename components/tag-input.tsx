"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  allowCreate?: boolean;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add and press Enter…",
  suggestions = [],
  allowCreate = true,
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const filtered = suggestions
    .filter((s) => !value.includes(s))
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 6);

  function add(tag: string) {
    const t = tag.trim();
    if (!t) return;
    if (!value.includes(t)) onChange([...value, t]);
    setInput("");
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim() && (allowCreate || suggestions.includes(input.trim()))) {
        add(input);
      }
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap gap-1 rounded-md border border-input bg-background px-2 py-1.5 min-h-9 shadow-sm focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[6rem] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {input && (filtered.length > 0 || allowCreate) ? (
        <div className="rounded-md border border-border bg-popover p-1 shadow-sm text-sm max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="block w-full text-left rounded px-2 py-1 hover:bg-accent"
            >
              {s}
            </button>
          ))}
          {allowCreate && !suggestions.includes(input.trim()) && input.trim() ? (
            <button
              type="button"
              onClick={() => add(input)}
              className="block w-full text-left rounded px-2 py-1 hover:bg-accent text-primary"
            >
              + Create &ldquo;{input.trim()}&rdquo;
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// type-<role> (index.css) sets family, size, line height, tracking and weight together,
// so a later type-* class replaces any earlier text size, font, leading or tracking class.
const twMerge = extendTailwindMerge<"type">({
  extend: {
    classGroups: {
      type: [{ type: ["display", "title", "heading", "subhead", "section", "prose", "body", "label", "caption"] }],
    },
    conflictingClassGroups: {
      type: ["font-size", "font-weight", "font-family", "leading", "tracking"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "../lib/cn";

const components: Components = {
  p: ({ className, ...props }) => (
    <p className={cn("mb-3 last:mb-0", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("mb-3 list-disc space-y-1 pl-5 last:mb-0", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("mb-3 list-decimal space-y-1 pl-5 last:mb-0", className)} {...props} />
  ),
  li: ({ className, ...props }) => <li className={cn("pl-1", className)} {...props} />,
  strong: ({ className, ...props }) => (
    <strong className={cn("font-bold text-vh-accent", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("underline underline-offset-2 hover:text-vh-accent", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  h1: ({ className, ...props }) => (
    <h4 className={cn("mb-2 mt-3 font-bold first:mt-0", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h4 className={cn("mb-2 mt-3 font-bold first:mt-0", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h4 className={cn("mb-2 mt-3 font-bold first:mt-0", className)} {...props} />
  ),
};

export default function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

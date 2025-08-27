"use client";

import { cn } from "@/lib/utils";
import { memo, useId, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { CodeBlockGroup, CodeBlock, CodeBlockCode } from "./code-block";
import { Button } from "../ui/button";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
};

function extractLanguage(className?: string): string {
  if (!className) return "plaintext";
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : "plaintext";
}

const CodeComponent = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  node?: any;
}) => {
  const { theme } = useTheme();
  const isInline =
    !props.node?.position?.start.line ||
    props.node?.position?.start.line === props.node?.position?.end.line;

  if (isInline) {
    return (
      <span
        className={cn(
          "bg-highlight rounded-sm px-1 font-mono text-sm",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children as string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = extractLanguage(className);
  const codeBlockTheme = theme === "dark" ? "github-dark" : "github-light";

  return (
    <CodeBlock className={className}>
      <CodeBlockGroup className="border-border border-b py-2 pr-2 pl-4">
        <div className="flex items-center gap-2">
          <div className="text-primary rounded px-2 py-1 text-xs font-mediu">
            {language.charAt(0).toUpperCase() + language.slice(1).toLowerCase()}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </CodeBlockGroup>
      <CodeBlockCode
        code={children as string}
        language={language}
        theme={codeBlockTheme}
      />
    </CodeBlock>
  );
};

const INITIAL_COMPONENTS: Partial<Components> = {
  code: CodeComponent,
  pre: ({ children }) => <>{children}</>,

  /* -------------  LISTS ------------- */
  ul: ({ children, ...props }) => (
    <ul
      className="
        list-disc list-outside
        my-4 pl-6 space-y-2
        [&_ul]:list-[circle]
        [&_ul_ul]:list-[square]
      "
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="
        list-decimal list-outside
        my-4 pl-6 space-y-2
        [&_ol]:list-[lower-alpha]
        [&_ol_ol]:list-[lower-roman]
      "
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed mb-1 last:mb-0" {...props}>
      {children}
    </li>
  ),

  /* -------------  PARAGRAPHS ------------- */
  p: ({ children, ...props }) => (
    <p className="leading-relaxed mb-4 last:mb-0" {...props}>
      {children}
    </p>
  ),

  /* -------------  HEADINGS ------------- */
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-bold mt-8 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-semibold mt-6 mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-medium mt-5 mb-2" {...props}>
      {children}
    </h3>
  ),

  /* -------------  BLOCKQUOTE ------------- */
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 my-6 italic text-gray-600"
      {...props}
    >
      {children}
    </blockquote>
  ),
};

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;

  // Merge custom components with defaults
  const mergedComponents = { ...INITIAL_COMPONENTS, ...components };

  return (
    <div
      className={cn("prose prose-sm max-w-none space-y-4", className)}
      id={blockId}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={mergedComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = "Markdown";

export { Markdown };

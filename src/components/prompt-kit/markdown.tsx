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
  pre: function PreComponent({ children }) {
    return <>{children}</>;
  },
  // Add proper styling for lists
  ul: function UlComponent({ children, ...props }) {
    return (
      <ul className="list-disc list-inside space-y-1 my-4 ml-4" {...props}>
        {children}
      </ul>
    );
  },
  ol: function OlComponent({ children, ...props }) {
    return (
      <ol className="list-decimal list-inside space-y-1 my-4 ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: function LiComponent({ children, ...props }) {
    return (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    );
  },
  // Add proper paragraph spacing
  p: function PComponent({ children, ...props }) {
    return (
      <p className="leading-relaxed" {...props}>
        {children}
      </p>
    );
  },
  // Add proper heading spacing
  h1: function H1Component({ children, ...props }) {
    return (
      <h1 className="text-2xl font-bold mb-4 mt-6" {...props}>
        {children}
      </h1>
    );
  },
  h2: function H2Component({ children, ...props }) {
    return (
      <h2 className="text-xl font-semibold mb-3 mt-5" {...props}>
        {children}
      </h2>
    );
  },
  h3: function H3Component({ children, ...props }) {
    return (
      <h3 className="text-lg font-medium mb-2 mt-4" {...props}>
        {children}
      </h3>
    );
  },
  // Add blockquote styling
  blockquote: function BlockquoteComponent({ children, ...props }) {
    return (
      <blockquote
        className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
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
      className={cn("prose prose-sm max-w-none space-y-4 mb-28", className)}
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

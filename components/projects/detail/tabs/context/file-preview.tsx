'use client'

import { FileQuestion } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker'
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go'
import ini from 'react-syntax-highlighter/dist/esm/languages/prism/ini'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'

import { ScrollArea } from '@/components/ui/scroll-area'
import type { FileContent } from '@/lib/api/context'

// Register only the languages we need (keeps the bundle small).
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('docker', docker)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('ini', ini)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('yaml', yaml)

const SUPPORTED_LANGUAGES = new Set([
  'bash',
  'css',
  'docker',
  'go',
  'ini',
  'javascript',
  'json',
  'jsx',
  'tsx',
  'typescript',
  'yaml',
])

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-3 mt-4 border-b pb-1 text-xl font-semibold tracking-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold tracking-tight">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-1.5 mt-3 text-base font-semibold">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="my-2 text-sm leading-6">{children}</p>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="my-3 overflow-x-auto rounded-md bg-muted p-3 text-xs font-mono leading-5">
      {children}
    </pre>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
    ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-primary underline underline-offset-4 hover:opacity-80">
      {children}
    </a>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-2 list-disc pl-5 text-sm leading-6">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-2 list-decimal pl-5 text-sm leading-6">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="my-0.5">{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-3 border-l-2 border-muted-foreground/30 pl-3 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border px-2 py-1 text-left font-medium">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border px-2 py-1">{children}</td>
  ),
  hr: () => <hr className="my-4" />,
}

/** Rendered markdown (for .md files). */
export function MarkdownView({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  )
}

/** Syntax-highlighted code view. */
export function CodeView({ file }: { file: FileContent }) {
  const language = SUPPORTED_LANGUAGES.has(file.language) ? file.language : undefined
  return (
    <ScrollArea className="h-full">
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers
        wrapLongLines={false}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: 12,
          lineHeight: 1.6,
          background: 'transparent',
          minHeight: '100%',
        }}
        codeTagProps={{ style: { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } }}
      >
        {file.content}
      </SyntaxHighlighter>
    </ScrollArea>
  )
}

/** Preview panel content: markdown render, highlighted code or a placeholder. */
export function FilePreview({ file }: { file: FileContent | null }) {
  if (!file) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <FileQuestion className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No file selected</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Click a file in the tree to preview its contents. Markdown files are rendered, code files
          get syntax highlighting.
        </p>
      </div>
    )
  }

  if (file.language === 'markdown') {
    return (
      <ScrollArea className="h-full">
        <div className="p-5">
          <MarkdownView content={file.content} />
        </div>
      </ScrollArea>
    )
  }

  return <CodeView file={file} />
}

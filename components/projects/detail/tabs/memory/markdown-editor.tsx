'use client'

import * as React from 'react'
import EasyMDE from 'easymde'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  /** Extra EasyMDE toolbar items appended to the default set. */
  extraToolbar?: Array<string | { name: string; action: (editor: EasyMDE) => void; title?: string }>
}

/**
 * Markdown editor built on EasyMDE (SimpleMDE's maintained successor).
 * Lightweight toolbar + preview + side-by-side, with dark-mode overrides
 * defined in globals.css.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = '220px',
  extraToolbar = [],
}: MarkdownEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const editorRef = React.useRef<EasyMDE | null>(null)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  React.useEffect(() => {
    const element = textareaRef.current
    if (!element) return

    const editor = new EasyMDE({
      element,
      initialValue: value,
      placeholder,
      spellChecker: false,
      status: false,
      minHeight,
      autoDownloadFontAwesome: false,
      renderingConfig: { singleLineBreaks: false },
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        'image',
        'code',
        'table',
        '|',
        'preview',
        'side-by-side',
        'fullscreen',
        ...(extraToolbar as unknown as readonly ('|' | { name: string; action: unknown })[]),
      ] as unknown as EasyMDE.Options['toolbar'],
    })
    editorRef.current = editor

    editor.codemirror.on('change', () => {
      onChangeRef.current(editor.value())
    })

    return () => {
      editor.toTextArea()
      editorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value changes (e.g. editing a different memory).
  React.useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.value() !== value) editor.value(value)
  }, [value])

  return <textarea ref={textareaRef} aria-label="Markdown editor" />
}

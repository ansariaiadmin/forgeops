'use client'

import * as React from 'react'
import { Check, Copy, PackageOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ContextPack } from '@/lib/api/context'

interface ContextPackDialogProps {
  pack: ContextPack | null
  onOpenChange: (open: boolean) => void
}

/** Preview of the generated AI context pack with a copy button. */
export function ContextPackDialog({ pack, onOpenChange }: ContextPackDialogProps) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    if (!pack) return
    await navigator.clipboard.writeText(pack.text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={!!pack} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageOpen className="size-4" />
            Context Pack
          </DialogTitle>
          <DialogDescription>
            {pack?.fileCount} files · {pack?.charCount.toLocaleString()} chars · ~
            {pack?.estimatedTokens.toLocaleString()} tokens — ready to paste into any AI agent.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96 rounded-md border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-foreground/80">
            {pack?.text}
          </pre>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import * as React from 'react'
import { FileUp, Loader2, Rocket, Square, Upload } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { ComposeConfig } from '@/lib/api/docker'

interface ComposePanelProps {
  compose: ComposeConfig | null
  busy: 'up' | 'down' | null
  status: 'up' | 'down' | null
  message: string | null
  onUpload: (file: File) => void
  onUp: () => void
  onDown: () => void
}

/** Docker Compose integration: upload, preview and up/down controls. */
export function ComposePanel({
  compose,
  busy,
  status,
  message,
  onUpload,
  onUp,
  onDown,
}: ComposePanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Docker Compose</CardTitle>
          <CardDescription>
            {compose ? (
              <>
                {compose.filename} · {compose.services.length} services
              </>
            ) : (
              'Upload a docker-compose.yml to orchestrate this project'
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <Badge
              variant="outline"
              className={
                status === 'up'
                  ? 'border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-600 dark:text-emerald-400'
                  : 'border-zinc-400/30 bg-zinc-400/10 font-mono text-[10px] text-zinc-600 dark:text-zinc-400'
              }
            >
              {status === 'up' ? 'UP' : 'DOWN'}
            </Badge>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".yml,.yaml"
            className="hidden"
            aria-label="Upload docker-compose.yml"
            onChange={handleFile}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            Upload docker-compose.yml
          </Button>
          <Button size="sm" onClick={onUp} disabled={!compose || busy !== null}>
            {busy === 'up' ? <Loader2 className="animate-spin" /> : <Rocket />}
            Compose Up
          </Button>
          <Button variant="outline" size="sm" onClick={onDown} disabled={!compose || busy !== null}>
            {busy === 'down' ? <Loader2 className="animate-spin" /> : <Square />}
            Compose Down
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        {compose ? (
          <>
            <ScrollArea className="max-h-72 rounded-md border bg-muted/30 p-3">
              <pre className="font-mono text-xs leading-5 text-foreground/80">
                {compose.content}
              </pre>
            </ScrollArea>
            {compose.services.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Services:</span>
                {compose.services.map((name) => (
                  <Badge key={name} variant="secondary" className="font-mono text-[10px]">
                    {name}
                  </Badge>
                ))}
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/50"
          >
            <FileUp className="size-6 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Click to upload docker-compose.yml</p>
              <p className="text-xs text-muted-foreground">Or drop the file here (YAML format)</p>
            </div>
          </button>
        )}

        {message && (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Compose:</span> {message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

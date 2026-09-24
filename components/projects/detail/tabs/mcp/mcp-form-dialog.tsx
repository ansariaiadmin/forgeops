'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { MCPConnection } from '@prisma/client'
import { Check, Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { MCP_TYPE_HINT, MCP_TYPE_LABEL, MCP_TYPE_OPTIONS, availableToolsFor } from '@/lib/api/mcp'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { mcpFormSchema, parseScopes, type McpFormValues } from '@/lib/validations/mcp'

interface McpFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, edits this connection; otherwise creates a new one. */
  connection?: MCPConnection | null
  onSubmit: (values: McpFormValues) => void
}

function toFormValues(connection: MCPConnection): McpFormValues {
  return {
    name: connection.name,
    type: (MCP_TYPE_OPTIONS.includes(connection.type as (typeof MCP_TYPE_OPTIONS)[number])
      ? connection.type
      : 'custom') as McpFormValues['type'],
    configJson: JSON.stringify(connection.config ?? {}, null, 2),
    allowedTools: Array.isArray(connection.allowedTools)
      ? (connection.allowedTools as string[])
      : [],
    scopesInput: Array.isArray(connection.scopes) ? (connection.scopes as string[]).join(', ') : '',
  }
}

const EMPTY_VALUES: McpFormValues = {
  name: '',
  type: 'github',
  configJson: '{\n  \n}',
  allowedTools: [],
  scopesInput: 'read, write',
}

/** Add / edit MCP connection modal: name, type, JSON config, tools and scopes. */
export function McpFormDialog({ open, onOpenChange, connection, onSubmit }: McpFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<McpFormValues>({
    resolver: zodResolver(mcpFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const type = watch('type')
  const allowedTools = watch('allowedTools')

  React.useEffect(() => {
    if (open) {
      reset(connection ? toFormValues(connection) : EMPTY_VALUES)
    }
  }, [open, connection, reset])

  const tools = availableToolsFor(type, allowedTools)

  function toggleTool(tool: string) {
    setValue(
      'allowedTools',
      allowedTools.includes(tool)
        ? allowedTools.filter((item) => item !== tool)
        : [...allowedTools, tool],
      { shouldValidate: true },
    )
  }

  async function handleFormSubmit(values: McpFormValues) {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    onSubmit(values)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{connection ? 'Edit connection' : 'Add MCP connection'}</DialogTitle>
          <DialogDescription>
            Connect an external tool through the Model Context Protocol.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          {/* Name + type */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mcp-name">Name</Label>
              <Input
                id="mcp-name"
                placeholder="e.g. GitHub"
                autoComplete="off"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Connection type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MCP_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {MCP_TYPE_LABEL[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-[11px] text-muted-foreground">{MCP_TYPE_HINT[type]}</p>
            </div>
          </div>

          {/* Config JSON */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mcp-config">Config (JSON)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() =>
                  setValue(
                    'configJson',
                    JSON.stringify(JSON.parse(watch('configJson') || '{}'), null, 2),
                    { shouldValidate: true },
                  )
                }
              >
                Format
              </Button>
            </div>
            <Textarea
              id="mcp-config"
              rows={6}
              className="font-mono text-xs"
              spellCheck={false}
              {...register('configJson')}
              aria-invalid={!!errors.configJson}
            />
            {errors.configJson && (
              <p className="text-xs font-medium text-destructive">{errors.configJson.message}</p>
            )}
          </div>

          {/* Allowed tools */}
          <div className="flex flex-col gap-2">
            <Label>Allowed tools</Label>
            {tools.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tools.map((tool) => {
                  const selected = allowedTools.includes(tool)
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleTool(tool)}
                      className={cn(
                        'flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[11px] font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {selected && <Check className="size-3" />}
                      {tool}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No preset tools for this type — pick from the suggestions or leave empty.
              </p>
            )}
            {errors.allowedTools && (
              <p className="text-xs font-medium text-destructive">{errors.allowedTools.message}</p>
            )}
          </div>

          {/* Scopes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="mcp-scopes">Scopes</Label>
            <Input
              id="mcp-scopes"
              placeholder="read, write, deploy"
              autoComplete="off"
              {...register('scopesInput')}
              aria-invalid={!!errors.scopesInput}
            />
            {watch('scopesInput') && (
              <div className="flex flex-wrap gap-1">
                {parseScopes(watch('scopesInput')).map((scope) => (
                  <span
                    key={scope}
                    className="rounded-md border bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            )}
            {errors.scopesInput && (
              <p className="text-xs font-medium text-destructive">{errors.scopesInput.message}</p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {connection ? 'Save changes' : 'Add connection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

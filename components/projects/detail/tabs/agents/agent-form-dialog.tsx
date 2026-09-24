'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Agent, AgentType } from '@prisma/client'
import { Check, Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { AGENT_TYPES, AGENT_TYPE_LABEL, AGENT_TOOLS, MODEL_OPTIONS } from '@/lib/api/agents'
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
import { agentFormSchema, type AgentFormValues } from '@/lib/validations/agent'

interface AgentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, edits this agent; otherwise creates a new one. */
  agent?: Agent | null
  mcps: Array<{ id: string; name: string }>
  onSubmit: (values: AgentFormValues) => void
}

function toFormValues(agent: Agent): AgentFormValues {
  return {
    name: agent.name,
    type: agent.type,
    model: (MODEL_OPTIONS.includes(agent.model as (typeof MODEL_OPTIONS)[number])
      ? agent.model
      : 'gpt-4o') as AgentFormValues['model'],
    systemPrompt: agent.systemPrompt,
    tools: Array.isArray(agent.tools) ? (agent.tools as string[]) : [],
    mcpIds: Array.isArray(agent.mcpIds) ? (agent.mcpIds as string[]) : [],
    scope: '',
  }
}

const EMPTY_VALUES: AgentFormValues = {
  name: '',
  type: 'DEVELOPER',
  model: 'gpt-4o',
  systemPrompt: '',
  tools: [],
  mcpIds: [],
  scope: '',
}

/** Create / edit agent modal: identity, model, prompt, tools, MCPs and scope. */
export function AgentFormDialog({
  open,
  onOpenChange,
  agent,
  mcps,
  onSubmit,
}: AgentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const tools = watch('tools')
  const mcpIds = watch('mcpIds')

  React.useEffect(() => {
    if (open) reset(agent ? toFormValues(agent) : EMPTY_VALUES)
  }, [open, agent, reset])

  function toggle(listName: 'tools' | 'mcpIds', value: string) {
    const list = listName === 'tools' ? tools : mcpIds
    setValue(
      listName,
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      { shouldValidate: true },
    )
  }

  async function handleFormSubmit(values: AgentFormValues) {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    onSubmit(values)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit agent' : 'Create agent'}</DialogTitle>
          <DialogDescription>
            Configure an AI agent for this project. Its system prompt, tools and MCP access define
            what it can do.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          {/* Name + type + model */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                placeholder="e.g. Builder"
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
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as AgentType)}
                  >
                    <SelectTrigger aria-label="Agent type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {AGENT_TYPE_LABEL[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Model</Label>
              <Controller
                control={control}
                name="model"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_OPTIONS.map((model) => (
                        <SelectItem key={model} value={model}>
                          <span className="font-mono">{model}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* System prompt */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-prompt">System prompt</Label>
            <Textarea
              id="agent-prompt"
              rows={5}
              placeholder="You are a senior engineer working on forge-core. Follow the conventions in Project Memory and use the provided tools to complete tasks…"
              {...register('systemPrompt')}
              aria-invalid={!!errors.systemPrompt}
            />
            {errors.systemPrompt ? (
              <p className="text-xs font-medium text-destructive">{errors.systemPrompt.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                The prompt that defines the agent&apos;s role, rules and goals.
              </p>
            )}
          </div>

          {/* Tools */}
          <div className="flex flex-col gap-2">
            <Label>Tools</Label>
            <div className="flex flex-wrap gap-1.5">
              {AGENT_TOOLS.map((tool) => {
                const selected = tools.includes(tool)
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggle('tools', tool)}
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
            {errors.tools && (
              <p className="text-xs font-medium text-destructive">{errors.tools.message}</p>
            )}
          </div>

          {/* MCPs */}
          <div className="flex flex-col gap-2">
            <Label>MCP connections</Label>
            {mcps.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {mcps.map((mcp) => {
                  const selected = mcpIds.includes(mcp.id)
                  return (
                    <button
                      key={mcp.id}
                      type="button"
                      onClick={() => toggle('mcpIds', mcp.id)}
                      className={cn(
                        'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {selected && <Check className="size-3" />}
                      {mcp.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No MCP connections in this project yet.
              </p>
            )}
          </div>

          {/* Scope */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-scope">Scope</Label>
            <Input
              id="agent-scope"
              placeholder="e.g. src/, docs/, deploy:staging"
              autoComplete="off"
              {...register('scope')}
              aria-invalid={!!errors.scope}
            />
            {errors.scope && (
              <p className="text-xs font-medium text-destructive">{errors.scope.message}</p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {agent ? 'Save changes' : 'Create agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

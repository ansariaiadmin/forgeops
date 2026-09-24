'use client'

import * as React from 'react'
import type { Agent } from '@prisma/client'
import { Bot, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface NewJobDialogProps {
  agent: Agent | null
  onOpenChange: (open: boolean) => void
  onRun: (task: string) => void
}

/** "New Job" modal — run a task with an agent. */
export function NewJobDialog({ agent, onOpenChange, onRun }: NewJobDialogProps) {
  const [task, setTask] = React.useState('')
  const [running, setRunning] = React.useState(false)

  React.useEffect(() => {
    if (agent) setTask('')
  }, [agent])

  async function handleRun() {
    if (!agent || task.trim().length < 3) return
    setRunning(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    onRun(task.trim())
    setRunning(false)
    setTask('')
  }

  return (
    <Dialog open={!!agent} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-4" />
            New Job — {agent?.name ?? 'agent'}
          </DialogTitle>
          <DialogDescription>
            Describe the task. The agent will pick the tools it needs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="job-task">Task</Label>
          <Textarea
            id="job-task"
            rows={4}
            placeholder="e.g. Fix the flaky e2e test in the checkout flow"
            value={task}
            onChange={(event) => setTask(event.target.value)}
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            {task.trim().length < 3 && 'Describe the task in at least a few words.'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={running || task.trim().length < 3}>
            {running ? <Loader2 className="animate-spin" /> : <Bot />}
            Run job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import * as React from 'react'
import { Bell, CheckCircle2, Loader2, TriangleAlert, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ALERT_CONFIGS, testAlert, type AlertConfig, type AlertTestResult } from '@/lib/api/health'
import { cn } from '@/lib/utils'

/** Alert configuration: toggles per condition + test alert. */
export function AlertsPanel() {
  const [configs, setConfigs] = React.useState<AlertConfig[]>(ALERT_CONFIGS)
  const [testingId, setTestingId] = React.useState<string | null>(null)
  const [testResult, setTestResult] = React.useState<AlertTestResult | null>(null)

  function toggle(id: string, enabled: boolean) {
    setConfigs((prev) => prev.map((config) => (config.id === id ? { ...config, enabled } : config)))
  }

  async function handleTest(config: AlertConfig) {
    setTestingId(config.id)
    setTestResult(null)
    const result = await testAlert(config)
    setTestingId(null)
    setTestResult(result)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <CardTitle className="text-base">Alert Configuration</CardTitle>
        </div>
        <CardDescription>
          Conditions that notify #deploys — {configs.filter((config) => config.enabled).length} of{' '}
          {configs.length} active
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {configs.map((config) => (
          <div
            key={config.id}
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 transition-opacity',
              !config.enabled && 'opacity-60',
            )}
          >
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                config.severity === 'critical'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              )}
            >
              <TriangleAlert className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{config.label}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[9px] uppercase',
                    config.severity === 'critical'
                      ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                  )}
                >
                  {config.severity}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{config.description}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={testingId !== null || !config.enabled}
                onClick={() => handleTest(config)}
              >
                {testingId === config.id ? <Loader2 className="animate-spin" /> : <Zap />}
                Test Alert
              </Button>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => toggle(config.id, checked)}
                aria-label={`Toggle ${config.label} alert`}
              />
            </div>
          </div>
        ))}

        {testResult && (
          <p className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            {testResult.message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

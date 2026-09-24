import { prisma } from '@/lib/prisma'

interface AuditInput {
  userId: string | null
  projectId?: string | null
  action: string
  resource: string
  details?: Record<string, unknown>
  request?: Request | null
}

/**
 * Append an entry to the audit log. Failures are swallowed (auditing must
 * never break the main request).
 */
export async function recordAudit({
  userId,
  projectId,
  action,
  resource,
  details,
  request,
}: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        projectId: projectId ?? null,
        action,
        resource,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ip: request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: request?.headers.get('user-agent') ?? null,
      },
    })
  } catch (error) {
    console.error('[audit] failed to record', error)
  }
}

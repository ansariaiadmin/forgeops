'use client'

import type { Environment, ProjectStatus } from '@prisma/client'
import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MockUser } from '@/lib/mock-data'

export type StatusFilter = 'ALL' | ProjectStatus
export type EnvironmentFilter = 'ALL' | Environment

interface ProjectFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  environment: EnvironmentFilter
  onEnvironmentChange: (value: EnvironmentFilter) => void
  owner: string
  onOwnerChange: (value: string) => void
  owners: MockUser[]
  resultCount: number
  totalCount: number
  hasFilters: boolean
  onClear: () => void
}

/** Search bar + status/environment/owner filters for the projects grid. */
export function ProjectFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  environment,
  onEnvironmentChange,
  owner,
  onOwnerChange,
  owners,
  resultCount,
  totalCount,
  hasFilters,
  onClear,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects by name or description..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-8"
        />
      </div>

      {/* Status */}
      <Select value={status} onValueChange={(value) => onStatusChange(value as StatusFilter)}>
        <SelectTrigger className="w-full lg:w-[160px]" aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="ARCHIVED">Archived</SelectItem>
          <SelectItem value="DELETED">Deleted</SelectItem>
        </SelectContent>
      </Select>

      {/* Environment */}
      <Select
        value={environment}
        onValueChange={(value) => onEnvironmentChange(value as EnvironmentFilter)}
      >
        <SelectTrigger className="w-full lg:w-[170px]" aria-label="Filter by environment">
          <SelectValue placeholder="All environments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All environments</SelectItem>
          <SelectItem value="DEV">Dev</SelectItem>
          <SelectItem value="STAGING">Staging</SelectItem>
          <SelectItem value="PROD">Prod</SelectItem>
        </SelectContent>
      </Select>

      {/* Owner */}
      <Select value={owner} onValueChange={onOwnerChange}>
        <SelectTrigger className="w-full lg:w-[160px]" aria-label="Filter by owner">
          <SelectValue placeholder="All owners" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All owners</SelectItem>
          {owners.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear + count */}
      <div className="flex items-center justify-between gap-2 lg:justify-end">
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X />
            Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {resultCount} of {totalCount}
        </span>
      </div>
    </div>
  )
}

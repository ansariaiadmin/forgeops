import { describe, expect, it } from 'vitest'

import { projectFormSchema } from '@/lib/validations/project'
import { serviceFormSchema } from '@/lib/validations/service'
import { ragSourceSchema } from '@/lib/validations/rag'
import { mcpFormSchema } from '@/lib/validations/mcp'
import { documentFormSchema } from '@/lib/validations/document'
import { slugify } from '@/utils/slug'

describe('project form validation', () => {
  it('accepts a valid project', () => {
    const result = projectFormSchema.safeParse({
      name: 'api-gateway',
      slug: 'api-gateway',
      description: 'Edge gateway',
      environment: 'PROD',
      techStack: ['Go', 'Redis'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects short names and invalid slugs', () => {
    const result = projectFormSchema.safeParse({
      name: 'x',
      slug: 'Bad Slug!',
      environment: 'DEV',
      techStack: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.name).toBeDefined()
      expect(fields.slug).toBeDefined()
    }
  })

  it('rejects unknown environments', () => {
    const result = projectFormSchema.safeParse({
      name: 'ok',
      slug: 'ok',
      environment: 'MOON',
      techStack: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('service form validation', () => {
  it('requires image:tag format', () => {
    expect(
      serviceFormSchema.safeParse({ name: 'web', image: 'nginx:1.27-alpine' }).success,
    ).toBe(true)
    expect(
      serviceFormSchema.safeParse({ name: 'web', image: 'nginx-without-tag' }).success,
    ).toBe(false)
  })

  it('rejects invalid service names', () => {
    expect(serviceFormSchema.safeParse({ name: 'Bad Name!', image: 'x:1' }).success).toBe(false)
    expect(serviceFormSchema.safeParse({ name: 'api-v2', image: 'x:1' }).success).toBe(true)
  })
})

describe('rag source validation', () => {
  it('requires http(s):// for URL sources', () => {
    expect(
      ragSourceSchema.safeParse({ type: 'URL', path: 'https://docs.example.com' }).success,
    ).toBe(true)
    expect(ragSourceSchema.safeParse({ type: 'URL', path: 'not-a-url' }).success).toBe(false)
    expect(ragSourceSchema.safeParse({ type: 'FILE', path: 'README.md' }).success).toBe(true)
  })
})

describe('mcp form validation', () => {
  it('accepts valid json config and rejects invalid json', () => {
    const base = {
      name: 'GitHub',
      type: 'github' as const,
      allowedTools: ['read_file'],
      scopesInput: 'read',
    }
    expect(mcpFormSchema.safeParse({ ...base, configJson: '{"repo":"org/x"}' }).success).toBe(true)
    expect(mcpFormSchema.safeParse({ ...base, configJson: '{not json' }).success).toBe(false)
    expect(mcpFormSchema.safeParse({ ...base, configJson: '[1,2]' }).success).toBe(false)
  })
})

describe('document form validation', () => {
  it('path must end with .md', () => {
    expect(
      documentFormSchema.safeParse({
        title: 'Guide',
        type: 'GUIDE',
        path: 'docs/guide.md',
        content: '# hi',
      }).success,
    ).toBe(true)
    expect(
      documentFormSchema.safeParse({
        title: 'Guide',
        type: 'GUIDE',
        path: 'docs/guide.txt',
        content: '# hi',
      }).success,
    ).toBe(false)
  })
})

describe('slugify', () => {
  it('normalizes to kebab-case', () => {
    expect(slugify('My Cool App!')).toBe('my-cool-app')
    expect(slugify('  API  Gateway  ')).toBe('api-gateway')
    expect(slugify('under_score_name')).toBe('under-score-name')
    expect(slugify('---')).toBe('')
  })
})

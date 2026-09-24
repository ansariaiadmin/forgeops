import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  getProjectDocuments,
  createDocument,
  deleteDocument,
  searchDocuments,
  saveDocument,
} from '@/lib/api/docs'

let testProjectId: string
let createdDocId: string

describe('Documents/RAG API — real Prisma integration', () => {
  beforeAll(async () => {
    const project = await prisma.project.findFirst()
    if (!project) throw new Error('Seed required')
    testProjectId = project.id
  })

  afterAll(async () => {
    if (createdDocId) {
      await prisma.document.delete({ where: { id: createdDocId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('findMany — returns documents for project', async () => {
    const docs = await getProjectDocuments(testProjectId)
    expect(Array.isArray(docs)).toBe(true)
    expect(docs.length).toBeGreaterThan(0)
    expect(docs[0]).toHaveProperty('title')
    expect(docs[0]).toHaveProperty('content')
    expect(docs[0]).toHaveProperty('path')
  })

  it('create + store file — validation and persistence', async () => {
    const uniquePath = `docs/test-${Date.now()}.md`
    const doc = await createDocument({
      projectId: testProjectId,
      title: 'Test Document',
      type: 'GUIDE',
      path: uniquePath,
      content: '# Test\n\nThis is a test document for vitest.',
    })

    createdDocId = doc.id
    expect(doc.title).toBe('Test Document')
    expect(doc.path).toBe(uniquePath)
    expect(doc.version).toBe(1)

    // Duplicate path should fail
    await expect(
      createDocument({
        projectId: testProjectId,
        title: 'Duplicate',
        type: 'GUIDE',
        path: uniquePath,
        content: 'Duplicate content',
      }),
    ).rejects.toThrow()

    // Invalid path (not .md)
    await expect(
      createDocument({
        projectId: testProjectId,
        title: 'Bad Path',
        type: 'GUIDE',
        path: 'docs/bad.txt',
        content: 'Content',
      }),
    ).rejects.toThrow()
  })

  it('delete + search — keyword search (vector fallback)', async () => {
    // Search before delete
    const results = await searchDocuments(testProjectId, 'test document')
    expect(Array.isArray(results)).toBe(true)
    // Should find at least our created doc
    const found = results.find((d) => d.id === createdDocId)
    expect(found).toBeDefined()

    // Update document
    const updated = await saveDocument(createdDocId, '# Updated\n\nNew content for search testing.')
    expect(updated.version).toBe(2)
    expect(updated.content).toContain('Updated')

    // Delete
    await deleteDocument(createdDocId)
    const after = await prisma.document.findUnique({ where: { id: createdDocId } })
    expect(after).toBeNull()
    createdDocId = ''

    // Search after delete should not find it
    const resultsAfter = await searchDocuments(testProjectId, 'test document')
    const foundAfter = resultsAfter.find((d) => d.id === createdDocId)
    expect(foundAfter).toBeUndefined()
  })
})

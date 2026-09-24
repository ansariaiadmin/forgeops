import { describe, expect, it } from 'vitest'

import { scoreChunk, searchKnowledgeBase, chunkTitle, type RagSourceView } from '@/lib/api/rag'
import { cosineSimilarity, pseudoEmbedding } from '@/lib/embeddings'

function makeSource(id: string, path: string, texts: string[], isIndexed = true): RagSourceView {
  return {
    id,
    projectId: 'proj-test',
    type: 'DOCUMENT',
    path,
    isIndexed,
    lastIndexedAt: new Date(),
    chunks: texts,
    embeddings: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: isIndexed ? 'INDEXED' : 'PENDING',
  }
}

describe('text scoring (token overlap)', () => {
  it('scores a chunk containing every query word higher', () => {
    const query = 'deploy production rollback'
    const good = scoreChunk(query, 'We deploy every change to production automatically.')
    const bad = scoreChunk(query, 'Backups run nightly to S3 storage.')
    expect(good).toBeGreaterThan(bad)
    expect(bad).toBe(0)
  })

  it('gives a bonus for exact phrase containment', () => {
    const withPhrase = scoreChunk('rollback failed deployments', 'We rollback failed deployments automatically.')
    const withoutPhrase = scoreChunk('rollback failed deployments', 'Rollbacks and failed deploys are handled.')
    expect(withPhrase).toBeGreaterThan(withoutPhrase)
  })
})

describe('hybrid search', () => {
  it('ranks the semantically related chunk first', () => {
    const sources = [
      makeSource('s1', 'docs/deploy.md', [
        'forge-core deployment pipeline runs containers to staging and production environments with automatic rollback.',
      ]),
      makeSource('s2', 'docs/backup.md', [
        'Nightly backups are stored in S3 and retained for 30 days.',
      ]),
      makeSource('s3', 'docs/api.md', [
        'The API validates requests with Zod before enqueuing jobs.',
      ]),
    ]
    const results = searchKnowledgeBase(sources, 'how does deployment work')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].source.id).toBe('s1')
  })

  it('skips non-indexed sources', () => {
    const sources = [
      makeSource('s1', 'docs/deploy.md', ['deployment pipeline runs nightly']),
      makeSource('s2', 'docs/pending.md', ['deployment pipeline pending'], false),
    ]
    const results = searchKnowledgeBase(sources, 'deployment pipeline')
    expect(results.length).toBe(1)
    expect(results[0].source.id).toBe('s1')
  })
})

describe('chunk title', () => {
  it('returns the first sentence, truncated', () => {
    expect(chunkTitle({ id: 'c1', text: 'Deployments are coordinated. Then workers run.' })).toBe(
      'Deployments are coordinated',
    )
    const long = 'x'.repeat(100)
    expect(chunkTitle({ id: 'c2', text: long })).toHaveLength(57)
  })
})

describe('embeddings', () => {
  it('produces unit vectors of the expected dimension', () => {
    const vector = pseudoEmbedding('deployments and pipelines')
    expect(vector).toHaveLength(256)
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
    expect(norm).toBeCloseTo(1, 5)
  })

  it('similar texts are closer than dissimilar ones', () => {
    const query = pseudoEmbedding('how do deployments work')
    const deploy = pseudoEmbedding('deploying containers to production')
    const backup = pseudoEmbedding('backups stored in S3 nightly')
    expect(cosineSimilarity(query, deploy)).toBeGreaterThan(cosineSimilarity(query, backup))
  })

  it('identical texts have cosine 1', () => {
    const a = pseudoEmbedding('the quick brown fox')
    expect(cosineSimilarity(a, pseudoEmbedding('the quick brown fox'))).toBeCloseTo(1, 4)
  })
})

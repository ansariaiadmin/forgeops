import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectDetailHeader } from '@/components/projects/detail/project-detail-header'
import { ProjectTabs } from '@/components/projects/detail/project-tabs'
import { getProjectDetail } from '@/lib/api/projects'

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const detail = await getProjectDetail(slug)
  return { title: detail ? detail.project.name : 'Project' }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params
  const detail = await getProjectDetail(slug)
  if (!detail) notFound()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <ProjectDetailHeader detail={detail} />
      <ProjectTabs detail={detail} />
    </div>
  )
}

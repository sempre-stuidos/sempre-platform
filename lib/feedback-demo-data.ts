import type { FeedbackItem, FeedbackStatus, FeedbackPriority, PageSectionV2 } from "@/lib/types"

const statusCycle: FeedbackStatus[] = ["open", "in_progress", "resolved"]
const priorityCycle: FeedbackPriority[] = ["high", "medium", "low"]

const demoAuthors = [
  { id: "client-1", name: "Alex Rivera", avatar: "https://avatar.vercel.sh/A" },
  { id: "client-2", name: "Morgan Shaw", avatar: "https://avatar.vercel.sh/M" },
  { id: "team-1", name: "Syd Palmer", avatar: "https://avatar.vercel.sh/S" },
]

const demoAssignees = [
  { id: "team-ops", name: "Ops Team", avatar: "https://avatar.vercel.sh/O" },
  { id: "team-design", name: "Design Team", avatar: "https://avatar.vercel.sh/D" },
  { id: "team-build", name: "Build Team", avatar: "https://avatar.vercel.sh/B" },
]

export function getDemoFeedbackForPage(
  pageId: string,
  orgId: string,
  sections: PageSectionV2[]
): FeedbackItem[] {
  if (sections.length === 0) return []

  return sections.slice(0, 6).map((section, index) => {
    const author = demoAuthors[index % demoAuthors.length]
    const assignee = demoAssignees[index % demoAssignees.length]
    const status = statusCycle[index % statusCycle.length]
    const priority = priorityCycle[index % priorityCycle.length]

    return {
      id: `demo-feedback-${index + 1}`,
      pageId,
      orgId,
      sectionId: section.id,
      sectionKey: section.key,
      componentKey: null,
      x: (index + 1) * 80,
      y: (index + 1) * 120,
      xRatio: 0.2 + (index % 3) * 0.25,
      yRatio: 0.2 + (index % 2) * 0.3,
      status,
      priority,
      title: `${section.label} needs update`,
      body:
        index % 2 === 0
          ? "Copy feels a bit long here—can we tighten the hero text?"
          : "Spacing between these cards feels off on mobile.",
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeAvatar: assignee.avatar,
      createdAt: new Date(Date.now() - index * 36_000_00).toISOString(),
      updatedAt: new Date(Date.now() - index * 18_000_00).toISOString(),
      commentCount: 2,
      comments: [
        {
          id: `demo-comment-${index + 1}-1`,
          feedbackId: `demo-feedback-${index + 1}`,
          authorId: assignee.id,
          authorName: assignee.name,
          authorAvatar: assignee.avatar,
          body: "Thanks for flagging, pulling new copy options today.",
          createdAt: new Date(Date.now() - index * 18_000_00).toISOString(),
        },
        {
          id: `demo-comment-${index + 1}-2`,
          feedbackId: `demo-feedback-${index + 1}`,
          authorId: author.id,
          authorName: author.name,
          authorAvatar: author.avatar,
          body: "Appreciate it—let me know when it's on staging.",
          createdAt: new Date(Date.now() - index * 12_000_00).toISOString(),
        },
      ],
    }
  })
}




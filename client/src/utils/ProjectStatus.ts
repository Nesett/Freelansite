import type { Project, Milestone } from "../pages/Projects"

export type TagVariant = "neutral" | "warning" | "success" | "hold"

export interface ProjectDisplayState {
	tag: string | null
	tagVariant: TagVariant
	deadlineText: string | null
	isUrgent: boolean
	progressPercent: number
}

// active milestone is the first in order that doesnt have "active" as status.
function getActiveMilestone(project: Project): Milestone | undefined {
	return project.milestones.find(m => m.status !== "APPROVED")
}

export function getDeadlineText(deadline?: string | null): { text: string, deadlineDay:string, isUrgent: boolean } {
	if (!deadline) {
		return { text: "No deadline", deadlineDay:"", isUrgent: false }
	}

	const diffMs = new Date(deadline).getTime() - Date.now()
	const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

	if (days > 1) {
		return { text: `Next deadline in:`, deadlineDay:` ${days} days`, isUrgent: days <= 3 }
	}

	if (days === 1) {
		return { text: "Next deadline in:", deadlineDay:"1 day", isUrgent: true }
	}

	if (days === 0) {
		return { text: "Deadline:", deadlineDay: "today", isUrgent: true }
	}

	const overtimeDays = Math.abs(days)

	return { text: `${overtimeDays} ${overtimeDays === 1 ? "day" : "days"} overtime`, deadlineDay: "", isUrgent: true }
}

export function getProjectDisplayState(project: Project): ProjectDisplayState {

	const progressPercent = project.progress

	const base = { progressPercent, deadlineText: null, isUrgent: false }

	if (project.status === "NOT_STARTED") {
		return { ...base, tag: "Not started", tagVariant: "neutral" }
	}

	if (project.status === "ON_HOLD") {
		return { ...base, tag: "On hold", tagVariant: "hold" }
	}

	if (project.status === "COMPLETED") {
		return { ...base, tag: "Completed", tagVariant: "success" }
	}

	if (project.status === "AWAITING_APPROVAL") {
		return { ...base, tag: "Awaiting approval", tagVariant: "warning" }
	}

	// for project status being "IN_PROGRESS"
	const activeMilestone = getActiveMilestone(project)

	if (!activeMilestone) {
		return { ...base, tag: "Completed", tagVariant: "success" }
	}

	if (activeMilestone.status === "AWAITING_APPROVAL") {
		return { ...base, tag: "Milestone awaiting approval", tagVariant: "warning" }
	}

	if (activeMilestone.status === "NOT_STARTED" && activeMilestone.orderIndex > 0) {
		return { ...base, tag: "Milestone approved", tagVariant: "success" }
	}

	// in-progress case (or the very first milestone, not yet started) has no tag just deadline
	const { text, isUrgent } = getDeadlineText(activeMilestone.deadline)

	return { tag: null, tagVariant: "neutral", deadlineText: text, isUrgent, progressPercent }
}
import type { Project, Milestone, ProjectStatusValue } from "../pages/Projects"

export type TagVariant = "neutral" | "warning" | "success" | "hold"

export interface ProjectDisplayState {
	tag: string | null
	tagVariant: TagVariant
	deadlineText: string | null
	deadlineDay: string
	isUrgent: boolean
	progressPercent: number
}

const PROJECT_TAGS: Record<ProjectStatusValue, { label: string, variant: TagVariant }> = {
	NOT_STARTED: { label: "Not started", variant: "neutral" },
	IN_PROGRESS: { label: "In progress", variant: "neutral" },
	AWAITING_APPROVAL: { label: "Awaiting approval", variant: "warning" },
	COMPLETED: { label: "Completed", variant: "success" },
	ON_HOLD: { label: "On hold", variant: "hold" }
}

export function getProjectTag(status: ProjectStatusValue) {
	return PROJECT_TAGS[status]
}

// active milestone is the first in order (sorted by orderIndex) that isn't approved yet.
export function getActiveMilestone(milestones: Milestone[]): Milestone | undefined {
	return [...milestones]
		.sort((a, b) => a.orderIndex - b.orderIndex)
		.find(m => m.status !== "APPROVED")
}

const MILESTONE_TAGS: Record<Milestone["status"], { label: string, variant: TagVariant }> = {
	NOT_STARTED: { label: "Pending", variant: "neutral" },
	CURRENTLY_WORKED_ON: { label: "In progress", variant: "neutral" },
	AWAITING_APPROVAL: { label: "Awaiting approval", variant: "warning" },
	APPROVED: { label: "Approved", variant: "success" }
}

export function getMilestoneTag(status: Milestone["status"]) {
	return MILESTONE_TAGS[status]
}

// editable while it hasn't been sent off for approval yet
export function isMilestoneEditable(status: Milestone["status"]): boolean {
	return status === "NOT_STARTED" || status === "CURRENTLY_WORKED_ON"
}

export type MilestoneBorderVariant = "green" | "red" | "black" | "yellow" | "none"

export function getMilestoneBorderVariant(milestone: Milestone, isActive: boolean): MilestoneBorderVariant {
	if (!isActive) {
		return "none"
	}

	if (milestone.status === "AWAITING_APPROVAL") {
		return "yellow"
	}

	if (!milestone.deadline) {
		return "green"
	}

	const diffMs = new Date(milestone.deadline).getTime() - Date.now()
	const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

	if (days < 0 && milestone.status === "CURRENTLY_WORKED_ON") {
		return "black"
	}

	return days < 7 ? "red" : "green"
}

export function formatMilestoneDeadline(deadline: string | null): string | null {
	if (!deadline) {
		return null
	}

	return new Date(deadline).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	})
}

export function formatMilestoneBudget(budget: number | null): string | null {
	if (budget === null) {
		return null
	}

	return `$${budget.toLocaleString("en-US")}`
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

	const base = { progressPercent, deadlineText: null, deadlineDay: "", isUrgent: false }

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

	const activeMilestone = getActiveMilestone(project.milestones)

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
	const { text, deadlineDay, isUrgent } = getDeadlineText(activeMilestone.deadline)

	return { tag: null, tagVariant: "neutral", deadlineText: text, deadlineDay, isUrgent, progressPercent }
}
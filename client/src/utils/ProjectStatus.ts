import type { Project, Milestone } from "../pages/Projects"

export type ProjectStatusValue = "NOT_STARTED" | "IN_PROGRESS" | "AWAITING_APPROVAL" | "COMPLETED"
export type TagVariant = "neutral" | "warning" | "success" | "hold" | "progress"

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
	IN_PROGRESS: { label: "In progress", variant: "progress" },
	AWAITING_APPROVAL: { label: "Awaiting Approval", variant: "warning" },
	COMPLETED: { label: "Completed", variant: "success" }
}

export const MILESTONE_PROGRESS: Record<string, number> = {
	NOT_STARTED: 0,
	CURRENTLY_WORKED_ON: 10,
	AWAITING_APPROVAL: 80,
	APPROVED: 100
}

export function countProgressPercent(milestones: { status: string }[]): number {
	if (milestones.length === 0) {
		return 0
	}

	const sum = milestones.reduce((amount, currentMilestone) => amount + (MILESTONE_PROGRESS[currentMilestone.status] || 0), 0)

	return Math.round(sum / milestones.length)
}

export function getProjectStatus(milestones: Milestone[]): ProjectStatusValue {
	if (milestones.length === 0 || milestones.every(m => m.status === "NOT_STARTED")) {
		return "NOT_STARTED"
	}

	if (milestones.every(m => m.status === "APPROVED")) {
		return "COMPLETED"
	}

	return "IN_PROGRESS"
}

export function getProjectTag(isOnHold: boolean, milestones: Milestone[]): { label: string, variant: TagVariant } {
	if (isOnHold) {
		return { label: "On hold", variant: "hold" }
	}

	return PROJECT_TAGS[getProjectStatus(milestones)]
}

// active milestone is the first in order (sorted by orderIndex) that isn't approved yet.
export function getActiveMilestone(milestones: Milestone[]): Milestone | undefined {
	return [...milestones]
		.sort((a, b) => a.orderIndex - b.orderIndex)
		.find(m => m.status !== "APPROVED")
}

const MILESTONE_TAGS: Record<Milestone["status"], { label: string, variant: TagVariant }> = {
	NOT_STARTED: { label: "Not Started", variant: "neutral" },
	CURRENTLY_WORKED_ON: { label: "In Progress", variant: "progress" },
	AWAITING_APPROVAL: { label: "Awaiting Approval", variant: "warning" },
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

export function getProjectTotalBudget(milestones: Milestone[]): number {
    return milestones.reduce((sum, m) => sum + (m.budget ?? 0), 0)
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

	if (project.isOnHold) {
		return { ...base, tag: "On hold", tagVariant: "hold" }
	}

	const status = getProjectStatus(project.milestones)

	if (status === "NOT_STARTED") {
		return { ...base, tag: "Not started", tagVariant: "neutral" }
	}

	if (status === "COMPLETED") {
		return { ...base, tag: "Completed", tagVariant: "success" }
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
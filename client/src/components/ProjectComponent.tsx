import MilestoneTag from "./MilestoneTag"
import StatusBar from "./StatusBar"
import type { Project } from "../pages/Projects"

interface ProjectProps {
	project: Project
	showClientLabel?: boolean
}

function getDaysUntil(deadline: string): number {
	const diff = new Date(deadline).getTime() - Date.now()
	return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function ProjectComponent({ project, showClientLabel = false }: ProjectProps) {
	const isAwaitingApproval = project.status === "awaiting_approval"
	const isCompleted = project.status === "completed"

	function getDeadlineText() {
		if (!project.deadline) return "No deadline"

		const days = getDaysUntil(project.deadline)
		const label = hasApprovedMilestone ? "Next deadline" : "Deadline in"

		return `${label}: ${days} ${days === 1 ? "day" : "days"}`
	}

	return (
		<div className="projectCardClientDetails">
			<div className="projectCardHeaderRow">
				{showClientLabel && (
					<p className="projectClientLabel">
						{project.client?.companyName || project.client?.name}
					</p>
				)}
				{!isAwaitingApproval && (
					<p className="projectDeadline">{getDeadlineText()}</p>
				)}
			</div>
			<div className="projectCardTitleRow">
				<h3>{project.title}</h3>
				{isAwaitingApproval && (
					<MilestoneTag milestoneStatus="Awaiting approval" />
				)}
			</div>
			<p>{project.budget ? `$${project.budget}` : 'No budget set'}</p>
			<StatusBar />
		</div>
	)
}
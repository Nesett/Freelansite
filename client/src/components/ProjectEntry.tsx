import StatusTag from "./StatusTag"
import StatusBar from "./StatusBar"
// import { getProjectDisplayState } from "../utils/ProjectStatus"
import type { Project } from "../pages/Projects"
import { useNavigate } from "react-router-dom"

interface ProjectProps {
	project: Project
	showClientLabel?: boolean
}

export default function ProjectComponent({ project, showClientLabel = false }: ProjectProps) {
	// hardocded stuff for now.
	const navigate = useNavigate()
	const tag = "Pending Milestones"
	const tagVariant: "neutral" = "neutral"
	const deadlineText = "no deadline"
	const isUrgent = false
	const progressPercent = 0

	// ill uncomment this when i fix routes for milestone
	// const { tag, tagVariant, deadlineText, isUrgent, progressPercent } = getProjectDisplayState(project)

	function handleRowClick(){
		navigate(`/projects/${project.id}`)
	}

	return (
		<div onClick={handleRowClick} className='clickableEntry'>
			<div className="projectCardClientDetails">
				<div className="projectCardHeaderRow">
					{showClientLabel && (
						<p className="projectClientLabel">
							{project.client.companyName || project.client.name}
						</p>
					)}
					{tag ? (
						<StatusTag label={tag} variant={tagVariant} />
					) : (
						deadlineText && (
							<p className={`projectDeadline${isUrgent ? " projectDeadline--urgent" : ""}`}>
								{deadlineText}
							</p>
						)
					)}
				</div>
				<div className="projectCardTitleRow">
					<h3>{project.title}</h3>
				</div>
				<p>{project.budget ? `$${project.budget}` : 'No budget set'}</p>
				<StatusBar percent={progressPercent} />
			</div>
		</div>
	)
}
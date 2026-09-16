import MilestoneTag from "../../../components/MilestoneTag"
import StatusBar from "../../../components/StatusBar"
import type { Project } from "../ClientsDetails"

interface ProjectProps {
	project: Project
}

export default function ProjectComponent({ project }: ProjectProps) {
	return (
		<div className="projectCardClientDetails">
			<div>
				<h3>{project.title}</h3>
				<MilestoneTag milestoneStatus="hardcoded for now" />
			</div>
			<p>{project.budget ? `$${project.budget}` : 'No budget set'}</p>
			<StatusBar />
		</div>
	)
}
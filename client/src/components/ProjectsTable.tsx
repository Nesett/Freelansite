import ProjectEntry from "./ProjectEntry"
import type { Project } from "../pages/Projects"

interface ProjectsTableProps {
    projects: Project[]
    showClient?: boolean
    emptyMessage?: string
}

export default function ProjectsTable({
    projects,
    showClient = false,
    emptyMessage = "No projects yet."
}: ProjectsTableProps) {
    return (
        <div className="clientsTableWrapper">
            <table className="clientsTable">
                <thead>
                    <tr>
                        <th>Project</th>
                        {showClient && <th>Client</th>}
                        <th>Progress</th>
                        <th>Budget</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map(project => (
                        <ProjectEntry key={project.id} project={project} showClient={showClient} />
                    ))}
                </tbody>
            </table>

            {projects.length === 0 && (
                <p className="tableEmptyState">{emptyMessage}</p>
            )}
        </div>
    )
}
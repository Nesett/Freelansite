import ProjectEntry from "./ProjectEntry"
import type { Project } from "../pages/Projects"

interface ProjectsTableProps {
    projects: Project[]
    showClient?: boolean
}

export default function ProjectsTable({ projects, showClient = false }: ProjectsTableProps) {
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
        </div>
    )
}
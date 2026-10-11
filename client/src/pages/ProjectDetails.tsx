import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import type { Project, Milestone, MagicLink} from "./Projects"
import { Plus, EllipsisVertical, Link, Copy, Check, User, Mail, Phone } from "lucide-react"
import AreYouSureModal from "../components/AreYouSureModal"
import StatusBar from "../components/StatusBar"
import StatusTag from "../components/StatusTag"
import { useNavigate } from "react-router-dom"
import { getProjectTag, getActiveMilestone, countProgressPercent } from "../utils/ProjectStatus"
import MilestoneEntry from "../components/MilestoneEntry"
import ProjectFormModal from "../components/ProjectFormModal"
import MilestoneFormModal from "../components/MilestoneFormModal"
import { useAuth } from "../context/AuthContext"
import MagicLinkFormModal from "../components/MagicLinkFormModal"



export default function ProjectDetails() {
	const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
	const [project, setProject] = useState<Project | null>(null)
    const [editOptions, setEditOptions] = useState<boolean>(false)
    const projectOptionsRef = useRef<HTMLDivElement | null>(null)
    const [areYouSure, setAreYouSure] = useState<boolean>(false)
	const [loading, setLoading] = useState<boolean>(true)
	const [errorMessage, setErrorMessage] = useState<string>("")
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [showAddMilestone, setShowAddMilestone] = useState<boolean>(false)
    const [ editProjectForm, setEditProjectForm] = useState<boolean>(false)
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
    const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(null)
    const [magicLink, setMagicLink] = useState<MagicLink | null>(null)
    const [showMagicLinkForm, setShowMagicLinkForm] = useState<boolean>(false)
    const [copied, setCopied] = useState<boolean>(false)
    const navigate = useNavigate()

	useEffect(() => {
        let isFinished = true

		async function fetchProjectDetails() {
            
			try {
				const [projectsRes, milestonesRes, magicLinksRes] = await Promise.all([
					fetch(`/api/projects/${id}`, { credentials: 'include' }),
					fetch(`/api/milestones?projectId=${id}`, { credentials: 'include' }),
                    fetch(`/api/projects/${id}/magic-links`, { credentials: 'include' })
				])
				if (!milestonesRes.ok || !projectsRes.ok) {
					throw new Error("Failed to fetch all necessary information.")
				}

				const milestonesJson = await milestonesRes.json()
				const projectsJson = await projectsRes.json()
                const magicLinksJson = magicLinksRes.ok ? await magicLinksRes.json(): null

				if (isFinished) {
					setMilestones(milestonesJson)
					setProject(projectsJson)
                    setMagicLink(magicLinksJson?.url ? magicLinksJson : null)
				}

			} catch (err) {
				if (err instanceof Error) {
					setErrorMessage(err.message)
				} else {
					setErrorMessage("An unexpected error occurred")
				}
			} finally {
				if (isFinished) {
					setLoading(false)
				}
			}
		}

		fetchProjectDetails()

		return () => {
			isFinished = false
		}

	}, [id])


    async function deleteProject() {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "DELETE",
                credentials: "include"
            })

            if (!res.ok) {
                throw new Error("Failed to delete project")
            }

            setAreYouSure(false)
            navigate("/projects")
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while deleting project.")
            }
        }
    }


    async function approveMilestone( milestoneId: string) {

        try {
            const res = await fetch(`/api/milestones/${milestoneId}/approve`, {
                method: "PUT",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
            })

            if (!res.ok) {
                throw new Error("Failed to create milestone.")
            }

            const data = await res.json()

        setMilestones(prev =>
            prev.map(m => m.id === milestoneId ? data.approvedMilestone : m)
        )

        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while deleting project.")
            }
        }
    }

    async function changeMilestoneStatus(milestoneId: string, status: Milestone["status"]) {
        try {
            const res = await fetch(`/api/milestones/${milestoneId}`, {
                method: "PUT",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ status })
            })

            if (!res.ok) {
                throw new Error("Failed to update milestone status.")
            }

            const data = await res.json()

            setMilestones(prev =>
                prev.map(m => m.id === milestoneId ? data.updatedMilestone : m)
            )

        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while updating milestone.")
            }
        }
    }

    async function deleteMilestone() {
        if (!milestoneToDelete) return

        try {
            const res = await fetch(`/api/milestones/${milestoneToDelete.id}`, {
                method: "DELETE",
                credentials: "include"
            })

            if (!res.ok) {
                throw new Error("Failed to delete milestone.")
            }

            setMilestones(prev => prev.filter(m => m.id !== milestoneToDelete.id))
            setMilestoneToDelete(null)

        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while deleting milestone.")
            }
        }
    }

    function handleProjectUpdated(data: unknown) {
        const { updatedProject } = data as { updatedProject: Project }
        setProject(prev => prev ? { ...prev, ...updatedProject } : prev)
        setEditProjectForm(false)
    }

    function closeMilestoneModal() {
        setShowAddMilestone(false)
        setEditingMilestone(null)
    }

    function handleMilestoneSaved(data: unknown) {
        if (editingMilestone) {
            const { updatedMilestone } = data as { updatedMilestone: Milestone }
            setMilestones(prev =>
                prev.map(m => m.id === updatedMilestone.id ? updatedMilestone : m)
            )
        } else {
            const { newMilestone } = data as { newMilestone: Milestone }
            setMilestones(prev => [...prev, newMilestone])
        }

        closeMilestoneModal()
    }

    function handleMagicLinkCreated(data: unknown) {
        setMagicLink(data as MagicLink)
        setShowMagicLinkForm(false)
    }

    async function deleteMagicLink() {
        try {
            const res = await fetch(`/api/projects/${id}/magic-links`, {
                method: "DELETE",
                credentials: "include"
            })

            if (!res.ok) {
                throw new Error("Failed to revoke magic link.")
            }

            setMagicLink(null)
            setErrorMessage("")
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while revoking magic link.")
            }
        }
    }

    function formatMoney(amount: number) {
        return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    }

    function formatInvoiceDate(date: string) {
        return new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    }

    async function copyMagicLink() {
        const url = magicLink?.url
        if (!url) return

        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopied(false)
        }
    }

    function showProjectOptions() {
        setEditOptions(prev => !prev)
    }

	if (loading) {
		return <p>Loading project details...</p>
	}

	if (errorMessage || !project) {
		return <p>{errorMessage || "Project not found."}</p>
	}

    const { label, variant } = getProjectTag(project.status)
    const sortedMilestones = [...milestones].sort((a, b) => a.orderIndex - b.orderIndex)
    const activeMilestone = getActiveMilestone(sortedMilestones)
    const currentProgress = countProgressPercent(milestones)

    const totalBudget = milestones.reduce((sum, m) => sum + (m.budget ?? 0), 0)
    const invoiced = project.invoices.reduce((sum, i) => sum + i.total, 0)
    const paid = project.invoices
        .filter(i => i.status === "PAID")
        .reduce((sum, i) => sum + i.total, 0)

    const isAdmin = user?.role === "admin"
    const contact = isAdmin
        ? {
            name: project.client.name || project.client.companyName,
            email: project.client.email,
            phone: project.client.phone
        }
        : {
            name: project.admin.name || project.admin.businessName,
            email: project.admin.email,
            phone: project.admin.phone
        }

	return (
		<div className="pageContent">
            {editProjectForm && (
                <ProjectFormModal
                    project={project}
                    onClose={() => setEditProjectForm(false)}
                    onSaved={handleProjectUpdated}
                />
            )}
            {areYouSure && (
                <AreYouSureModal 
                    itemType="project"
                    itemName={project.title}
                    warningMessage="Deleting this project will permanently remove all associated milestones, invoices etc."
                    setAreYouSure={setAreYouSure} 
                    onConfirm={deleteProject}
                />
            )}
            {(showAddMilestone || editingMilestone) && (
                <MilestoneFormModal
                    milestone={editingMilestone ?? undefined}
                    projectId={id}
                    orderIndex={milestones.length}
                    onClose={closeMilestoneModal}
                    onSaved={handleMilestoneSaved}
                />
            )}
            {showMagicLinkForm && (
                <MagicLinkFormModal
                    projectId={project.id}
                    onClose={() => setShowMagicLinkForm(false)}
                    onSaved={handleMagicLinkCreated}
                />
            )}
            {milestoneToDelete && (
                <AreYouSureModal
                    itemType="milestone"
                    itemName={milestoneToDelete.title ?? ""}
                    warningMessage="This milestone will be removed from the project."
                    setAreYouSure={() => setMilestoneToDelete(null)}
                    onConfirm={deleteMilestone}
                />
            )}
			<header className="projectHeader">
                <div className="projectHeaderInfo">
                    <p className="projectHeaderClient">{project.client.companyName ? project.client.companyName : project.client.name}</p>
                    <h1>{project.title}</h1>
                    {project.description && (
                        <p className="projectDescription">{project.description}</p>
                    )}
                    <StatusBar percent={currentProgress}/>
                </div>
                <div className="projectHeaderActions">
                    <StatusTag label={label} variant={variant} />
                    <div className="projectOptionsWrapper" ref={projectOptionsRef}>
                        <button onClick={showProjectOptions} className="projectOptionsButton"><EllipsisVertical /></button>
                        {editOptions && (
                            <div className="clientOptionsMenu">
                                <button onClick={()=>setAreYouSure(prev=>!prev)} className="clientOptionsMenuItem">Delete project</button>
                                <button onClick={()=>setEditProjectForm(prev=>!prev)} className="clientOptionsMenuItem">Edit project</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <hr />
			<main className="projectBody">
                <div className="projectMilestonesDiv">
                    <div className="milestoneHeader">
                        <h2>Milestones</h2>
                        <button onClick={()=>setShowAddMilestone(prev=>!prev)} className="newButton">
                            <Plus />
                            Add Milestone
                        </button>
                    </div>
                    <div className="projectMilestones">
                        {sortedMilestones.length > 0 ? (
                            sortedMilestones.map(milestone => (
                                <MilestoneEntry
                                    key={milestone.id}
                                    milestone={milestone}
                                    isActive={milestone.id === activeMilestone?.id}
                                    onApprove={approveMilestone}
                                    onEdit={setEditingMilestone}
                                    onDelete={setMilestoneToDelete}
                                    onChangeStatus={changeMilestoneStatus}
                                />
                            ))
                        ) : (<p>No milestones found for this project.</p>)}
                    </div>
                </div>
                <section className="projectSummaryCard">
                    <h3>Summary</h3>
                    <div className="projectSummaryRows">
                        <div className="projectSummaryRow">
                            <span>Total budget</span>
                            <span>{formatMoney(totalBudget)}</span>
                        </div>
                        <div className="projectSummaryRow">
                            <span>Invoiced</span>
                            <span>{formatMoney(invoiced)}</span>
                        </div>
                        <div className="projectSummaryRow">
                            <span>Paid</span>
                            <span>{formatMoney(paid)}</span>
                        </div>
                    </div>
                    <div className="projectSummaryContact">
                        <p className="projectSummaryContactLabel">{isAdmin ? "Client contact" : "Admin contact"}</p>
                        <p className="projectSummaryContactItem">
                            <User />
                            {contact.name}
                        </p>
                        <p className="projectSummaryContactItem">
                            <Mail />
                            {contact.email}
                        </p>
                        {contact.phone && (
                            <p className="projectSummaryContactItem">
                                <Phone />
                                {contact.phone}
                            </p>
                        )}
                    </div>
                </section>
                <section className="projectInvoicesCard">
                    <div className="projectDetailsInvoicesHeader">
                        <h3>Invoices</h3>
                        <button className="statusPill statusPill--paid magicLinkButton">New Invoice</button>
                    </div>
                    {project.invoices.length > 0 ? (
                        <ul className="projectInvoiceList">
                            {project.invoices.map(invoice => (
                                <li
                                    key={invoice.id}
                                    className="projectInvoiceItem clickableEntry"
                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                    onKeyDown={e => { if (e.key === "Enter") navigate(`/invoices/${invoice.id}`) }}
                                    role="link"
                                    tabIndex={0}
                                    >
                                    <span className="projectInvoiceNumber">Invoice #{invoice.number}</span>
                                    <span className="projectInvoiceDate">{formatInvoiceDate(invoice.issueDate)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No invoices for this project yet.</p>
                    )}
                </section>

                <section className="magicLinksCard">
                    <div className="magicLinksHeader">
                        <div className="magicLinkHeaderElements">
                            <Link />
                            <h3>Magic Links</h3>
                            <span>Read-only access for stakeholders</span>
                        </div>
                        {user?.role === 'admin' && (magicLink
                            ? <button onClick={deleteMagicLink} className="statusPill statusPill--overdue magicLinkButton">Revoke Link</button>
                            : <button onClick={() => setShowMagicLinkForm(true)} className="statusPill statusPill--paid magicLinkButton">Create Link</button>
                        )}
                    </div>
                    <div className="magicLinksBody">
                        {magicLink ? (
                            <div className="magicLinkEntry">
                                <div className="magicLinkExpires">
                                    <p>Expires At:</p>
                                    <p>{new Date(magicLink.expiresAt).toLocaleDateString("sv-SE")}</p>
                                </div>
                                <div className="magicLinkUrl">
                                    <p>Link:</p>
                                    <p className="magicLinkUrlText">{magicLink.url}</p>
                                    <button onClick={copyMagicLink} className="projectOptionsButton magicLinkCopy" aria-label="Copy link">
                                        {copied ? <Check /> : <Copy />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="magicLinksEmpty">No active magic links for this project.</p>
                        )}
                    </div>
                </section>
			</main>
		</div>
	)
}
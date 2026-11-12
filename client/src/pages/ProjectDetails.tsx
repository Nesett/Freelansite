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
import InvoiceFormModal from "../components/InvoiceFormModal"
import { formatInvoiceNumber } from "../components/InvoiceEntry"



export default function ProjectDetails() {
	const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
	const [project, setProject] = useState<Project | null>(null)
    const [editOptions, setEditOptions] = useState<boolean>(false)
    const projectOptionsRef = useRef<HTMLDivElement | null>(null)
    const [areYouSure, setAreYouSure] = useState<boolean>(false)
    const [holdConfirm, setHoldConfirm] = useState<boolean>(false)
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
    const [showInvoiceForm, setShowInvoiceForm] = useState<boolean>(false)
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


    async function setProjectHold(isOnHold: boolean) {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "PUT",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ isOnHold })
            })

            if (!res.ok) {
                throw new Error(isOnHold ? "Failed to put project on hold." : "Failed to resume project.")
            }

            const { updatedProject } = await res.json() as { updatedProject: Project }

            setProject(prev => prev ? { ...prev, isOnHold: updatedProject.isOnHold } : prev)
            setHoldConfirm(false)
            setEditOptions(false)
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while updating project.")
            }
        }
    }


    async function approveMilestone( milestoneId: string) {
        if (project?.isOnHold) return

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
        if (project?.isOnHold) return
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
        if (!milestoneToDelete || project?.isOnHold) return

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

    function handleInvoiceSaved(data: unknown) {
        const { invoice } = data as { invoice: Project["invoices"][number] }
        setProject(prev => prev ? { ...prev, invoices: [invoice, ...prev.invoices] } : prev)
        setShowInvoiceForm(false)
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

    const { label, variant } = getProjectTag(project.isOnHold, milestones)
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
            {editProjectForm && isAdmin && (
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
            {holdConfirm && (
                <AreYouSureModal
                    itemType="project"
                    itemName={project.title}
                    title="Put this project on hold?"
                    warningMessage="While this project is on hold, you won't be able to edit it, add or edit milestones, or create invoices. You can resume it at any time."
                    confirmLabel="Put on hold"
                    setAreYouSure={setHoldConfirm}
                    onConfirm={() => setProjectHold(true)}
                />
            )}
            {(showAddMilestone || editingMilestone) && !project.isOnHold && (
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
            {showInvoiceForm && !project.isOnHold && (
                <InvoiceFormModal
                    projectId={project.id}
                    projectTitle={project.title}
                    defaults={{
                        adminName: project.admin.businessName || project.admin.name || "",
                        adminAddress: project.admin.address ?? "",
                        clientName: project.client.companyName || project.client.name || "",
                        clientAddress: project.client.address ?? ""
                    }}
                    onClose={() => setShowInvoiceForm(false)}
                    onSaved={handleInvoiceSaved}
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
                                {isAdmin && !project.isOnHold && (
                                    <button onClick={()=>setEditProjectForm(prev=>!prev)} className="clientOptionsMenuItem">Edit project</button>
                                )}
                                {isAdmin && (project.isOnHold
                                    ? <button onClick={()=>setProjectHold(false)} className="clientOptionsMenuItem">Resume project</button>
                                    : <button onClick={()=>{ setEditOptions(false); setHoldConfirm(true) }} className="clientOptionsMenuItem">Put on hold</button>
                                )}
                                
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
                        <button onClick={()=>setShowAddMilestone(prev=>!prev)} className="newButton" disabled={project.isOnHold}>
                            <Plus />
                            Add Milestone
                        </button>
                    </div>
                    <div className="projectMilestones" style={project.isOnHold ? { pointerEvents: "none", opacity: 0.55 } : undefined}>
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
                        {isAdmin && (
                            <button className="newButtonSmall" onClick={() => setShowInvoiceForm(true)} disabled={project.isOnHold}><Plus /> New Invoice</button>
                        )}
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
                                    <span className="projectInvoiceNumber">{formatInvoiceNumber(invoice.number)}</span>
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
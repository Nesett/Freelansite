import type { Milestone } from "../pages/Projects"
import { Lock, Calendar, Edit, Trash2 } from "lucide-react"
import StatusTag from "./StatusTag"
import { useAuth } from "../context/AuthContext"

import {
    getMilestoneTag,
    isMilestoneEditable,
    getMilestoneBorderVariant,
    formatMilestoneDeadline,
    formatMilestoneBudget
} from "../utils/ProjectStatus"

interface MilestoneProps {
    milestone: Milestone
    isActive: boolean
    onApprove: (milestoneId: string) => void
    onEdit: (milestone: Milestone) => void
    onDelete: (milestone: Milestone) => void
    onChangeStatus: (milestoneId: string, status: Milestone["status"]) => void
}

export default function MilestoneEntry({ milestone, isActive, onApprove, onEdit, onDelete, onChangeStatus }: MilestoneProps) {

    const { user } = useAuth()
    const { label, variant } = getMilestoneTag(milestone.status)
    const editable = isMilestoneEditable(milestone.status)
    const borderVariant = getMilestoneBorderVariant(milestone, isActive)
    const formattedDeadline = formatMilestoneDeadline(milestone.deadline ?? null)
    const formattedBudget = formatMilestoneBudget(milestone.budget ?? null)
    const isAdmin = user?.role === 'admin'

    const statusAction =
        milestone.status === 'NOT_STARTED'
            ? { label: 'Start working on milestone', next: 'CURRENTLY_WORKED_ON' as const, style: 'start' }
            : milestone.status === 'CURRENTLY_WORKED_ON'
                ? { label: 'Request approval', next: 'AWAITING_APPROVAL' as const, style: 'request' }
                : null

    return (
    <div className="milestoneTimelineItem">
        <span className={`milestoneDot milestoneDot--${variant}`} />
        <div className={`milestoneHolder${borderVariant !== "none" ? ` milestoneHolder--${borderVariant}` : ""}`}>
            <div className="milestoneHeaderRow">
                <h4>{milestone.title}</h4>
                <div className="milestoneHeaderRight">
                    <StatusTag label={label} variant={variant} />
                    {!editable && (<Lock />)}
                </div>
            </div>
            {milestone.description && (
                <p className="milestoneDescription">{milestone.description}</p>
            )}
            <div className="milestoneDateAndBudget">
                {formattedDeadline && (
                <div className="milestoneDate">
                    <Calendar />
                    <span>{formattedDeadline}</span>
                </div>
                )}
                {formattedBudget && (<span>{formattedBudget}</span>)}
            </div>
            <hr/>
            <div className="milestoneEditArea">
                {isAdmin && isActive && statusAction && (
                <button
                    type="button"
                    className={`milestoneStatusButton milestoneStatusButton--${statusAction.style}`}
                    onClick={() => onChangeStatus(milestone.id, statusAction.next)}
                >
                    {statusAction.label}
                </button>
                )}

                {milestone.status === 'AWAITING_APPROVAL' && user?.role === 'client' && (
                <button
                    type="button"
                    className="milestoneStatusButton milestoneStatusButton--approve"
                    onClick={() => onApprove(milestone.id)}
                >
                    Approve milestone
                </button>
                )}

                {isAdmin && (
                <div className="milestoneAdminActions">
                    <button
                        type="button"
                        className="milestoneEditButton"
                        disabled={!editable}
                        onClick={() => onEdit(milestone)}
                    >
                        <Edit />
                        <span>{editable ? 'Edit' : 'Locked'}</span>
                    </button>
                    {editable && (
                    <button
                        type="button"
                        className="milestoneDeleteButton"
                        onClick={() => onDelete(milestone)}
                    >
                        <Trash2 />
                        <span>Delete</span>
                    </button>
                    )}
                </div>
                )}
            </div>
        </div>
    </div>
    )
}
import type { Milestone } from "../pages/Projects"
import { Lock, Calendar, Edit } from "lucide-react"
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
}



export default function MilestoneEntry({ milestone, isActive, onApprove }: MilestoneProps) {

    const { user } = useAuth()
    const { label, variant } = getMilestoneTag(milestone.status)
    const editable = isMilestoneEditable(milestone.status)
    const borderVariant = getMilestoneBorderVariant(milestone, isActive)
    const formattedDeadline = formatMilestoneDeadline(milestone.deadline)
    const formattedBudget = formatMilestoneBudget(milestone.budget)

    return (
    <div className={`milestoneHolder${borderVariant !== "none" ? ` milestoneHolder--${borderVariant}` : ""}`}>
        <div className="milestoneHeaderRow">
            <h4>{milestone.title}</h4>
            <StatusTag label={label} variant={variant} />
            {!editable && (<Lock />)}
        </div>
        <div className="milestoneDateAndBudget">
        {formattedDeadline && (
            <div className="milestoneDate">
                <Calendar />
                <span>{formattedDeadline}</span>
            </div>)
        }
        {formattedBudget && (<span>{formattedBudget}</span>)}
        </div>
        <hr/>
        <div className="milestoneEditArea">
            {user?.role === 'admin' && (
            <>
                <Edit />
                <span>{editable ? 'Edit' : 'Locked'}</span>
            </>)}

            {milestone.status === 'AWAITING_APPROVAL' && user?.role === 'client' && (
            <button className="newButton" onClick={() => onApprove(milestone.id)}>
                Approve milestone
            </button>
            )}
        </div>
    </div>
    )
}
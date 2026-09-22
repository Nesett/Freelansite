import type { Milestone } from "../pages/Projects"
import { Lock, Calendar, Edit } from "lucide-react"
import StatusTag from "./StatusTag"
import {
    getMilestoneTag,
    isMilestoneEditable,
    getMilestoneBorderVariant,
    formatMilestoneDeadline,
    formatMilestoneBudget
} from "../utils/ProjectStatus"

interface MilestoneProps {
    milestone: Milestone
    isActive?: boolean
}

export default function MilestoneEntry({ milestone, isActive = false }: MilestoneProps) {

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
            <Edit />
            <span>{editable ? 'Edit' : 'Locked'}</span>
        </div>
    </div>
    )
}
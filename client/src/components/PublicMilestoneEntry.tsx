import type { Milestone } from "../pages/Projects"
import { Calendar } from "lucide-react"
import StatusTag from "./StatusTag"

import {
    getMilestoneTag,
    getMilestoneBorderVariant,
    formatMilestoneDeadline
} from "../utils/ProjectStatus"

interface PublicMilestoneProps {
    milestone: Milestone
    isActive: boolean
}

export default function PublicMilestoneEntry({ milestone, isActive }: PublicMilestoneProps) {

    const { label, variant } = getMilestoneTag(milestone.status)
    const borderVariant = getMilestoneBorderVariant(milestone, isActive)
    const formattedDeadline = formatMilestoneDeadline(milestone.deadline)

    return (
    <div className={`milestoneHolder${borderVariant !== "none" ? ` milestoneHolder--${borderVariant}` : ""}`}>
        <div className="milestoneHeaderRow">
            <h4>{milestone.title}</h4>
            <StatusTag label={label} variant={variant} />
        </div>
        {formattedDeadline && (
            <div className="milestoneDateAndBudget">
                <div className="milestoneDate">
                    <Calendar />
                    <span>{formattedDeadline}</span>
                </div>
            </div>
        )}
        {milestone.description && (
            <p className="milestoneDescription">{milestone.description}</p>
        )}
    </div>
    )
}
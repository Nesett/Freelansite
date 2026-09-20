import type { Milestone } from "../pages/Projects"
import { Lock, Calendar, Edit } from "lucide-react"

interface MilestoneProps {
    milestone: Milestone
    showEditOptions?: boolean
}

export default function MilestoneEntry({milestone, showEditOptions=false}: MilestoneProps) {
    return (
    <div className="milestoneHolder">
        <div className="milestoneHeaderRow">
            <h4>{milestone.title}</h4>
            <p>status</p>
            {!showEditOptions && (<Lock />)}
        </div>
        <div className="milestoneDateAndBudget">
        {milestone.deadline !== null && (
            <div className="milestoneDate">
                <Calendar />
                <span>{milestone.deadline}</span>
            </div>)
        }
        {milestone.budget !== null && (<span>{milestone.budget}</span>)}
        </div>
        <hr/>
        <div className="milestoneEditArea">
            <Edit />
            <span>{showEditOptions ? 'Edit' : 'Locked'}</span>
        </div>
    </div>
    )
}
import { MilestoneStatus } from '@prisma/client'

const MILESTONE_PROGRESS: Record<MilestoneStatus, number> = {
    NOT_STARTED: 0,
    CURRENTLY_WORKED_ON: 10,
    AWAITING_APPROVAL: 80,
    APPROVED: 100
}

export default function countProgressPercent(milestones: { status: MilestoneStatus }[]): number {
    if (milestones.length === 0) {
        return 0
    }

    const sum = milestones.reduce((amount, currentMilestone) => amount + MILESTONE_PROGRESS[currentMilestone.status], 0)

    return Math.round(sum / milestones.length)
}
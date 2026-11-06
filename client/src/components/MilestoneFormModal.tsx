import { useState, type FormEvent } from "react"
import Modal from "./Modal"
import type { Milestone } from "../pages/Projects"

type MilestoneFormModalProps = {
    milestone?: Milestone // pass it = edit mode, leave out = create mode
    projectId?: string // needed for create
    orderIndex?: number // needed for create
    onClose: () => void
    onSaved: (data: unknown) => void
}

export default function MilestoneFormModal({
    milestone,
    projectId,
    orderIndex,
    onClose,
    onSaved
}: MilestoneFormModalProps) {
    const isEdit = !!milestone

    const [title, setTitle] = useState<string>(milestone?.title ?? "")
    const [description, setDescription] = useState<string>(milestone?.description ?? "")
    const [budget, setBudget] = useState<number | "">(milestone?.budget ?? "")
    const [deadline, setDeadline] = useState<string>(milestone?.deadline ? milestone.deadline.slice(0, 10) : "")
    const [saving, setSaving] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            const url = milestone ? `/api/milestones/${milestone.id}` : `/api/milestones`

            const res = await fetch(url, {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...(isEdit ? {} : { projectId, orderIndex }),
                    title,
                    description,
                    budget: budget === "" ? null : budget,
                    deadline: deadline === "" ? null : deadline
                })
            })

            if (!res.ok) {
                throw new Error("Request failed")
            }

            onSaved(await res.json())
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("An unexpected error occured.")
                console.error("error:", err)
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            title={isEdit ? "Edit milestone" : "Add new milestone"}
            submitLabel={isEdit ? "Save changes" : "Add new milestone"}
            onClose={onClose}
            onSubmit={handleSubmit}
            saving={saving}
            error={error}
        >
            <label htmlFor="title">Title</label>
            <input
                id="title"
                name="title"
                type="text"
                placeholder="Dashboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            <label htmlFor="description">Description</label>
            <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <label htmlFor="budget">Budget</label>
            <input
                id="budget"
                name="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : "")}
            />

            <label htmlFor="deadline">Deadline</label>
            <input
                id="deadline"
                name="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
            />
        </Modal>
    )
}
import { useState, type FormEvent } from "react"
import Modal from "./Modal"
import type { Project } from "../pages/Projects"

type ProjectFormModalProps = {
    project?: Project // if passed then we edit if not then we create
    clientId?: string
    onClose: () => void
    onSaved: (data: unknown) => void
}

export default function ProjectFormModal({
    project,
    clientId,
    onClose,
    onSaved
}: ProjectFormModalProps) {
    const isEdit = !!project

    const [title, setTitle] = useState<string>(project?.title ?? "")
    const [description, setDescription] = useState<string>(project?.description ?? "")
    const [budget, setBudget] = useState<number | "">(project?.budget ?? "")
    const [saving, setSaving] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            const url = project ? `/api/projects/${project.id}` : `/api/projects/`

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...(isEdit ? {} : { clientId }),
                    title,
                    description,
                    budget: budget === "" ? null : budget
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
            title={isEdit ? "Edit project" : "Add new project"}
            submitLabel={isEdit ? "Save changes" : "Add new project"}
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
                placeholder="E-commerce platform"
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
        </Modal>
    )
}
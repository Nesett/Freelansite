import type { TagVariant } from "../utils/ProjectStatus"

interface StatusTagProps {
	label: string
	variant?: TagVariant
}

export default function StatusTag({ label, variant = "neutral" }: StatusTagProps) {
	return (
		<div className={`statusTag statusTag--${variant}`}>{label}</div>
	)
}
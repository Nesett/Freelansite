import { useEffect, type RefObject } from "react"

export default function useClickOutside(
	isOpen: boolean,
	onClose: () => void,
	targetRef: RefObject<HTMLElement | null>
) {
	useEffect(() => {
		if (!isOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			const element = targetRef.current
			if (element && !element.contains(event.target as Node)) {
				onClose()
			}
		}

		document.addEventListener("mousedown", handleClickOutside)

		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [isOpen, onClose, targetRef])
}
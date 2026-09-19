import type { Dispatch, SetStateAction } from "react"
import { X } from "lucide-react"

interface AreYouSureModalProps {
	itemType: string
	itemName: string
	warningMessage?: string
	setAreYouSure: Dispatch<SetStateAction<boolean>>
	onConfirm: () => void | Promise<void>
}

export default function AreYouSureModal({
	itemType,
	itemName,
	warningMessage,
	setAreYouSure,
	onConfirm
}: AreYouSureModalProps) {
	return (
		<div className="modalOverlay">
			<div className="areYouSureModal">
				<div className="areYouSureModalTop">
					<button onClick={() => setAreYouSure(false)}><X /></button>
					<h2>Do you want to delete {itemType}?</h2>
				</div>
				<h1>{itemName}</h1>
				{warningMessage && <p>{warningMessage}</p>}
				<div className="areYouSureModalButtons">
					<button 
						className="areYouSureCancelButton" 
						onClick={() => setAreYouSure(false)}
					>
						Cancel
					</button>
					<button 
						className="areYouSureProceedButton" 
						onClick={onConfirm}
					>
						Proceed
					</button>
				</div>
			</div>
		</div>
	)
}
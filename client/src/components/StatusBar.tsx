interface StatusBarProps {
	percent: number
}

export default function StatusBar({ percent }: StatusBarProps) {
	const clamped = Math.min(100, Math.max(0, Math.round(percent)))

	return(
		<div className="statusBarHolder">
			<div className="statusBarTrack">
				<div className="statusBarFill" style={{ width: `${clamped}%` }} />
			</div>
			<p>{clamped}%</p>
		</div>
	)
}
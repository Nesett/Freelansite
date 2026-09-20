import type { LucideIcon } from 'lucide-react'

export type Feature = {
	icon: LucideIcon
	title: string
	text: string
}

export default function FeaturesLandingPage({ icon: Icon, title, text }: Feature) {
	return (
		<article className="landingFeature">
			<div className="landingFeatureIcon">
				<Icon size={18} strokeWidth={2} />
			</div>
			<h3>{title}</h3>
			<p>{text}</p>
		</article>
	)
}
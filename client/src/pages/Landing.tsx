import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	ArrowRight,
	Check,
	Copy,
	FileText,
	FolderKanban,
	Link2,
	Lock,
	ShieldCheck,
	TrendingUp,
} from 'lucide-react'
import FeaturesLandingPage from '../components/FeaturesLandingPage'
import type { Feature } from '../components/FeaturesLandingPage'

const features: Feature[] = [
	{
		icon: FolderKanban,
		title: 'Stay perfectly organized',
		text: "One home for every client. All their projects in one place, each showing who's responsible for it.",
	},
	{
		icon: TrendingUp,
		title: 'Real-time project progress',
		text: 'See the true state of every project at a glance, with a progress meter that is always up to date.',
	},
	{
		icon: Check,
		title: 'Milestones with real sign-off',
		text: 'Get a clear yes on every phase. Clients approve finished milestones with one click, so you always know you\u2019re good to move on.',
	},
	{
		icon: FileText,
		title: 'Invoice vault',
		text: 'Every invoice for every project, kept together in one tidy place. Find what you need in seconds and print it in a click.',
	},
	{
		icon: Link2,
		title: 'Share with stakeholders',
		text: 'Need to keep your boss or investor updated? Send a secure magic link with a read-only view of progress and milestones. No account, no password, and you can switch it off any time.',
	},
]

const securityPoints: string[] = [
	'No client self-registration',
	'Internal notes hidden from clients',
	'Approved milestones locked',
	'Public links rate-limited & scoped',
]

const magicLink = 'freelansite.com/public/abc123'

export default function LandingPage() {
	const navigate = useNavigate()
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(magicLink)
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch {
			setCopied(false)
		}
	}

	return (
		<div className="landingPage">
			<header className="landingHeader">
				<div className="landingContainer landingHeaderInner">
					<span className="landingBrand">Freelansite</span>
					<div className="landingHeaderActions">
						<button
							type="button"
							className="landingLoginButton"
							onClick={() => navigate('/login')}
						>
							Log in
						</button>
						<button
							type="button"
							className="landingPrimaryButton landingPrimaryButton--small"
							onClick={() => navigate('/signup')}
						>
							Get started
						</button>
					</div>
				</div>
			</header>

			<main>
				<section className="landingHero">
					<div className="landingContainer landingHeroInner">
						<div className="landingHeroText">
							<p className="landingEyebrow">
								Project management for freelancers &amp; small agencies
							</p>
							<h1>
								Your clients stay informed.
								<br />
								You stay focused.
							</h1>
							<p className="landingHeroDescription">
								Freelansite is a client management platform for freelancers and
								small agencies. It keeps every project, milestone and invoice in
								one place, and gives your clients a login where progress,
								approvals and billing are always up to date.
							</p>
							<div className="landingHeroButtons">
								<button
									type="button"
									className="landingPrimaryButton"
									onClick={() => navigate('/signup')}
								>
									Get started for free
									<ArrowRight size={18} />
								</button>
							</div>
							<p className="landingHeroNote">
								No credit card required <span aria-hidden="true">&bull;</span>{' '}
								Set up in minutes
							</p>
						</div>

						<div className="landingHeroVisual">
							<div className="landingBlob" aria-hidden="true" />
							<img
								className="landingMockup"
								src="/images/projectMockup.png"
								alt="Freelansite project dashboard showing a client's projects and milestones"
							/>
						</div>
					</div>
				</section>

				<section className="landingFeatures">
					<div className="landingContainer landingFeaturesGrid">
						{features.map((feature) => (
							<FeaturesLandingPage key={feature.title} {...feature} />
						))}
					</div>
				</section>

				<section className="landingSecurity">
					<div className="landingContainer landingSecurityGrid">
						<div className="landingSecurityText">
							<p className="landingSectionLabel">Built for trust</p>
							<h2>Secure at every step.</h2>
							<p>
								Client accounts can&rsquo;t self-register (you control who gets
								in), internal notes are stripped from anything a client or public
								link could ever see, approved milestones are locked server-side,
								and the public link is rate-limited and scoped independently of
								everything else.
							</p>
						</div>

						<div className="landingControlCard">
							<div className="landingControlHeader">
								<ShieldCheck size={44} strokeWidth={1.5} />
								<h3>
									Your work.
									<br />
									Your control.
								</h3>
							</div>
							<ul>
								{securityPoints.map((point) => (
									<li key={point}>
										<Check size={14} strokeWidth={2.5} />
										{point}
									</li>
								))}
							</ul>
						</div>

						<div className="landingLinkCard">
							<div className="landingLinkCardHeader">
								<Lock size={14} />
								<h4>Secure magic link</h4>
							</div>
							<p>
								Share a read-only view with your stakeholders. No login
								required.
							</p>
							<div className="landingLinkBox">
								<span>{magicLink}</span>
								<button
									type="button"
									onClick={handleCopy}
									aria-label={copied ? 'Link copied' : 'Copy link'}
								>
									{copied ? <Check size={16} /> : <Copy size={16} />}
								</button>
							</div>
						</div>
					</div>
				</section>
			</main>
		</div>
	)
}
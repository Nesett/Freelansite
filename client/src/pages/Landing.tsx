import { Link } from 'react-router-dom'

export function LandingPage() {
	return (
		<div>
			<h1>Welcome to Freelansite</h1>
			<Link to="/login">Sign In</Link>
		</div>
	)
}
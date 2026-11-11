import loginImg from '../images/loginImg.png'
import { useState} from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Role = 'admin' | 'client'

const LOGIN_ENDPOINTS: Record<Role, string> = {
	admin: '/api/auth/login',
	client: '/api/clients/login'
}

export default function LoginPage() {
	const [ role, setRole ] = useState<Role>('admin')
	const [ showPassword, setShowPassword ] = useState(false)
	const [ password, setPassword ] = useState("")
	const [ email, setEmail ] = useState("")
	const [ errorMessage, setErrorMessage] = useState("")
	const navigate = useNavigate()
	const { refreshUser } = useAuth()

	async function handleSubmit() {
		

		try {

			const response = await fetch(LOGIN_ENDPOINTS[role], {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify({email, password})
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || "Something went wrong")
			}

			await refreshUser()
			console.log("logged in!")
			navigate(role === "admin" ? "/dashboard" : "/projects")

		} catch(err: unknown) {
			if (err instanceof Error) {
				setErrorMessage(err.message)
			} else {
				setErrorMessage("An unexpected error occured.")
			}
		}

	}

	function switchRole(newRole: Role) {
		setRole(newRole)
		setErrorMessage("")
	}

	function togglePassword() {

		setShowPassword(prevShowPass=>!prevShowPass)

	}

	return (
		<main className="signPagesMain">
			<div className="brandName">
				<h1>Freelansite</h1>
			</div>

			<div className="signInWrapper">
			<div className="roleTabs" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={role === 'admin'}
					className={`roleTab ${role === 'admin' ? 'roleTab--active' : ''}`}
					onClick={() => switchRole('admin')}>
					Admin
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={role === 'client'}
					className={`roleTab ${role === 'client' ? 'roleTab--active' : ''}`}
					onClick={() => switchRole('client')}>
					Client
				</button>
			</div>

			<div className="signInContainer">
				<h2>Sign In</h2>

				<form className="signInForm" action={handleSubmit}>
					<label className="inputField" htmlFor="email">
						<span className="fieldIcon fieldIcon--email" aria-hidden="true" />
						<input
							id="email"
							name="email"
							type="email"
							placeholder="Email"
							autoComplete="email"
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</label>

					<label className="inputField" htmlFor="password">
						<span className="fieldIcon fieldIcon--lock" aria-hidden="true" />
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Password"
							autoComplete="current-password"
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<button 
						type="button"
						className="passwordToggle"
						onClick={togglePassword}
						aria-label={showPassword ? 'Hide password' : 'Show password'}>
							{showPassword ? "HIDE" : "SHOW" }
						</button>
					</label>

					<a className="forgotPassword" href="#">
						Forgot Password?
					</a>

					<label className="rememberMe" htmlFor="rememberMe">
						<input id="rememberMe" name="rememberMe" type="checkbox" />
						<span>Remember me</span>
					</label>

					{errorMessage && <p className="errorMessage">{errorMessage}</p>}

					<button type="submit" className="signInButton">
						Sign in
					</button>
				</form>

				{role === 'admin' && (
					<>
				<div className="orDivider">
					<span>Or</span>
				</div>

				<div className="diffAuth">
					<button type="button" className="diffAuthElement">
						<span className="authIcon authIcon--microsoft" aria-hidden="true" />
						<h4>Microsoft</h4>
					</button>
					<button type="button" className="diffAuthElement">
						<span className="authIcon authIcon--google" aria-hidden="true" />
						<h4>Google</h4>
					</button>
					<button type="button" className="diffAuthElement">
						<span className="authIcon authIcon--linkedin" aria-hidden="true" />
						<h4>LinkedIn</h4>
					</button>
				</div>

				<div className="switchSignText">
					<p>Don't have an account?</p>
					<Link to="/signup">Sign Up</Link>
				</div>
					</>
				)}
			</div>
			</div>

			<div className="signInSideImg">
				<img className="illustrationImg" src={loginImg} alt="" />
			</div>
		</main>
	)
}
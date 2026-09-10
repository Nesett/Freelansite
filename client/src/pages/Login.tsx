import loginImg from '../images/loginImg.png'
import { useState } from 'react'

export function LoginPage() {
	const [showPassword, setShowPassword] = useState(false)

	function togglePassword() {
		setShowPassword(prevShowPass=>!prevShowPass)
	}

	return (
		<main className="signPagesMain">
			<div className="brandName">
				<h1>Freelansite</h1>
			</div>

			<div className="signInContainer">
				<h2>Sign In</h2>

				<form className="signInForm">
					<label className="inputField" htmlFor="email">
						<span className="fieldIcon fieldIcon--email" aria-hidden="true" />
						<input
							id="email"
							name="email"
							type="email"
							placeholder="Email"
							autoComplete="email"
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

					<button type="submit" className="signInButton">
						Sign in
					</button>
				</form>

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
					<a href="#">Sign Up</a>
				</div>
			</div>

			<div className="signInSideImg">
				<img className="illustrationImg" src={loginImg} alt="" />
			</div>
		</main>
	)
}
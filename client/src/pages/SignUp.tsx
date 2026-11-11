import loginImg from '../images/loginImg.png'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function SignUpPage() {
    const [ name, setName ] = useState("")
    const [ businessName, setBusinessName ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ confirmPassword, setConfirmPassword ] = useState("")
    const [ showPassword, setShowPassword ] = useState(false)
    const [ errorMessage, setErrorMessage ] = useState("")
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.")
            return
        }

        setIsSubmitting(true)
        setErrorMessage("")

        try {
            const response = await fetch('/api/auth/signup', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    businessName: businessName || undefined
                })
            })

            const data = await response.json()

            if (!response.ok) {
                if (Array.isArray(data.details) && data.details.length > 0) {
                    const messages = data.details.map((d: { message: string }) => d.message)
                    throw new Error(messages.join(" "))
                }
                throw new Error(data.error || "Something went wrong")
            }

            navigate("/login")

        } catch (err: unknown) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    function togglePassword() {
        setShowPassword(prev => !prev)
    }

    return (
        <main className="signPagesMain">
            <div className="brandName">
                <h1>Freelansite</h1>
            </div>

            <div className="signInWrapper">
                <div className="signInContainer">
                    <h2>Create Account</h2>

                    <form className="signInForm" onSubmit={handleSubmit}>
                        <label className="inputField" htmlFor="name">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Full name"
                                autoComplete="name"
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </label>

                        <label className="inputField" htmlFor="businessName">
                            <input
                                id="businessName"
                                name="businessName"
                                type="text"
                                placeholder="Business name"
                                autoComplete="organization"
                                onChange={(e) => setBusinessName(e.target.value)}
                            />
                        </label>

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
                                autoComplete="new-password"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="passwordToggle"
                                onClick={togglePassword}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? "HIDE" : "SHOW"}
                            </button>
                        </label>

                        <label className="inputField" htmlFor="confirmPassword">
                            <span className="fieldIcon fieldIcon--lock" aria-hidden="true" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm password"
                                autoComplete="new-password"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </label>

                        {errorMessage && <p className="errorMessage">{errorMessage}</p>}

                        <button type="submit" className="signInButton" disabled={isSubmitting}>
                            {isSubmitting ? "Creating account..." : "Sign up"}
                        </button>
                    </form>

                    <div className="switchSignText">
                        <p>Already have an account?</p>
                        <Link to="/login">Sign In</Link>
                    </div>
                </div>
            </div>

            <div className="signInSideImg">
                <img className="illustrationImg" src={loginImg} alt="" />
            </div>
        </main>
    )
}
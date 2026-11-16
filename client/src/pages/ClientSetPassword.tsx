import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useToast } from "../context/ToastContext"


export default function ClientSetPassword() {

    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const { showError } = useToast()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        try {
            const res = await fetch('/api/clients/set-password', {
                method: 'PUT',
                headers: {"Content-Type": "application/json"},
                credentials:  'include',
                body: JSON.stringify({
                    token,
                    password
                })
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong")
            }

            navigate('/login')
        } catch (err) {
            if (err instanceof Error) {
                showError(err.message)
            } else {
                showError("An unexpected error occurred.")
            }
        }
    }


    return (
        <>
            <h2>Welcome to freelansite!</h2>
            <h2>Set your password here:</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                />
                <button type="submit">Save Password</button>
            </form>
            <p>After successfully adding your password, you will be moved to login page.</p>
        </>
    )
}
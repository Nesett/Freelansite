import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"


export default function ClientSetPassword() {

    const [searchParams] = useSearchParams()
	const token = searchParams.get('token')
	const [password, setPassword] = useState('')
	const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
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
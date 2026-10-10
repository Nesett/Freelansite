import { useNavigate } from 'react-router-dom'
import type { Client } from '../pages/Clients'

interface ClientEntryProps {
	client: Client
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
})

function formatDeadline(nextDeadline: string | null) {
	if (!nextDeadline) {
		return { label: 'No deadline', className: 'deadlineNone' }
	}

	const msPerDay = 1000 * 60 * 60 * 24
	const daysLeft = Math.ceil((new Date(nextDeadline).getTime() - Date.now()) / msPerDay) 

	if (daysLeft < 0) {
		return { label: `${Math.abs(daysLeft)}d overdue`, className: 'deadlineUrgent' }
	}

	if (daysLeft === 0) {
		return { label: 'Due today', className: 'deadlineUrgent' } 
	}

	return {
		label: `${daysLeft}d left`,
		className: daysLeft <= 7 ? 'deadlineUrgent' : 'deadlineNormal',
	}
}

export default function ClientEntry({ client }: ClientEntryProps) { 
	const deadline = formatDeadline(client.nextDeadline)
	const navigate = useNavigate()

	function handleRowClick(){
		navigate(`/clients/${client.id}`)
	}

	return (
		<tr onClick={handleRowClick} className='clickableEntry'>
			<td>
				{client.companyName ? (
					<>
						<div className="clientPrimary">{client.companyName}</div>
						<div className="clientSecondary">{client.name}</div>
					</>
				) : (
					<div className="clientPrimary">{client.name}</div>
				)}
			</td>
			<td>
				<div>{client.email}</div>
				{client.phone && <div className="contactSecondary">{client.phone}</div>}
			</td>
			<td>
				<span className={deadline.className}>{deadline.label}</span>
			</td>
			<td>{dateFormatter.format(new Date(client.lastActive))}</td>
		</tr>
	)
}
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

const escapeHtml = (text: string) =>
    text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    const response = await fetch(BREVO_URL, {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY as string,
            'content-type': 'application/json',
            accept: 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'Freelansite', email: process.env.MAIL_FROM },
            to: [{ email: to }],
            subject,
            htmlContent
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to send email:', response.status, errorText)
        throw new Error(`Email failed with status ${response.status}`)
    }

    const data = await response.json()
    console.log('Email sent successfully!', data.messageId)
    return data
}

export const sendInviteEmail = async (clientEmail: string, inviteLink: string, name: string) => {
    return sendEmail(
        clientEmail,
        'Welcome to Freelansite - Set up your password',
        `<h1>${escapeHtml(name)} invited you to join Freelansite!</h1><hr/><p>Click <a href="${inviteLink}">here</a> to set up your account.</p>`
    )
}

export const sendAdminAddedYouEmail = async (clientEmail: string, name: string) => {
    return sendEmail(
        clientEmail,
        `You have been added by ${name}`,
        `<p>${escapeHtml(name)} has added you to their clients list. Open Freelansite to see more.</p>`
    )
}
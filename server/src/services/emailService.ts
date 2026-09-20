import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()


const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.GMAIL_EMAIL,
		pass: process.env.GMAIL_APP_PASSWORD
	}
})

export const sendInviteEmail = async (clientEmail: string, inviteLink: string, name: string) => {
	try {
		const mail = await transporter.sendMail({
			from: process.env.GMAIL_EMAIL,
			to: clientEmail,
			subject: 'Welcome to Freelansate - Set up your password',
			html: `<h1>${name} invited you to join Freelansate!<h1><hr/><p>Click <a href="${inviteLink}">here</a> to set up your account.</p>`
		})
		
		console.log('Email sent successfully!', mail.messageId)
		return mail
	} catch (error) {
		console.error('Failed to send email:', error)
		throw error
	}
}

export const sendAdminAddedYouEmail = async (clientEmail: string, name: string) => {
	try {
		const mail = await transporter.sendMail({
			from: process.env.GMAIL_EMAIL,
			to: clientEmail,
			subject: `You have been added by ${name}`,
			html: `<p>${name} has added you to their clients list. Open freelansate to see more.</p>`
		})
		
		console.log('Email sent successfully!', mail.messageId)
		return mail
	} catch (error) {
		console.error('Failed to send email:', error)
		throw error
	}
}
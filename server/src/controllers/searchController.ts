import { Request, Response } from 'express'
import db from '../db/db.js'

const MAX_RESULTS = 5
const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 100

function contains(term: string) {
    return { contains: term, mode: 'insensitive' as const }
}

export async function search(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ error: 'Access denied.' })
    }

    const term = String(req.query.q ?? '').trim().slice(0, MAX_QUERY_LENGTH)

    if (term.length < MIN_QUERY_LENGTH) {
        return res.json({ clients: [], projects: [], invoices: [] })
    }

    // "#015", "015" and "15" all find invoice number 15
    const numberTerm = term.replace(/^#/, '')
    const invoiceNumberFilter = /^\d{1,9}$/.test(numberTerm)
        ? [{ number: Number(numberTerm) }]
        : []

    try {
        if (req.userRole === 'admin') {
            const adminId = req.user.id

            const [adminClients, projects, invoices] = await Promise.all([
                db.adminClient.findMany({
                    where: {
                        adminId,
                        deletedByAdmin: false,
                        OR: [
                            { name: contains(term) },
                            { companyName: contains(term) },
                            { client: { email: contains(term) } }
                        ]
                    },
                    select: {
                        clientId: true,
                        name: true,
                        companyName: true,
                        client: { select: { email: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: MAX_RESULTS
                }),
                db.project.findMany({
                    where: {
                        adminId,
                        deletedByAdmin: false,
                        OR: [
                            { title: contains(term) },
                            {
                                client: {
                                    adminClients: {
                                        some: {
                                            adminId,
                                            OR: [
                                                { name: contains(term) },
                                                { companyName: contains(term) }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    select: {
                        id: true,
                        title: true,
                        client: {
                            select: {
                                email: true,
                                adminClients: {
                                    where: { adminId },
                                    select: { name: true, companyName: true }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: MAX_RESULTS
                }),
                db.invoice.findMany({
                    where: {
                        deletedByAdmin: false,
                        project: { adminId, deletedByAdmin: false },
                        OR: [
                            { clientName: contains(term) },
                            { project: { title: contains(term) } },
                            ...invoiceNumberFilter
                        ]
                    },
                    select: {
                        id: true,
                        number: true,
                        clientName: true,
                        project: { select: { title: true } }
                    },
                    orderBy: { issueDate: 'desc' },
                    take: MAX_RESULTS
                })
            ])

            return res.json({
                clients: adminClients.map(ac => ({
                    id: ac.clientId,
                    name: ac.name,
                    companyName: ac.companyName,
                    email: ac.client.email
                })),
                projects: projects.map(project => {
                    const adminClient = project.client.adminClients[0]

                    return {
                        id: project.id,
                        title: project.title,
                        clientName: adminClient?.companyName || adminClient?.name || project.client.email
                    }
                }),
                invoices: invoices.map(invoice => ({
                    id: invoice.id,
                    number: invoice.number,
                    clientName: invoice.clientName,
                    projectTitle: invoice.project.title
                }))
            })
        }

        // client role: only their own projects and invoices, no clients
        const clientId = req.user.id

        const [projects, invoices] = await Promise.all([
            db.project.findMany({
                where: {
                    clientId,
                    deletedByClient: false,
                    deletedByAdmin: false,
                    OR: [
                        { title: contains(term) },
                        { admin: { businessName: contains(term) } },
                        { admin: { name: contains(term) } }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    admin: { select: { name: true, businessName: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: MAX_RESULTS
            }),
            db.invoice.findMany({
                where: {
                    deletedByClient: false,
                    deletedByAdmin: false,
                    project: { clientId, deletedByClient: false, deletedByAdmin: false },
                    OR: [
                        { adminName: contains(term) },
                        { project: { title: contains(term) } },
                        ...invoiceNumberFilter
                    ]
                },
                select: {
                    id: true,
                    number: true,
                    adminName: true,
                    project: { select: { title: true } }
                },
                orderBy: { issueDate: 'desc' },
                take: MAX_RESULTS
            })
        ])

        return res.json({
            clients: [],
            projects: projects.map(project => ({
                id: project.id,
                title: project.title,
                clientName: project.admin.businessName || project.admin.name
            })),
            invoices: invoices.map(invoice => ({
                id: invoice.id,
                number: invoice.number,
                clientName: invoice.adminName,
                projectTitle: invoice.project.title
            }))
        })
    } catch (error) {
        console.error('Search failed:', error)
        return res.status(500).json({ error: 'Search failed.' })
    }
}
type ClientSnapshot = {
    clientName: string | null
    clientCompanyName: string | null
    clientEmail: string
}

// if client exists take that, if not take the copy from project
export function resolveClient<C extends { email: string }>(client: C | null, snapshot: ClientSnapshot) {
    if (client) {
        return { ...client, accountDeleted: false }
    }

    return {
        id: null,
        email: snapshot.clientEmail,
        name: snapshot.clientName,
        companyName: snapshot.clientCompanyName,
        phone: null,
        address: null,
        accountDeleted: true
    }
}
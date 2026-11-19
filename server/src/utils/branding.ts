import type { Admin } from "@prisma/client"

// Pro is active when the plan is PRO and the paid period (if one is tracked) has not ended. billing is not connected yet so a PRO plan without currentPeriodEnd counts as active.
export function isProActive(admin: Pick<Admin, "plan" | "currentPeriodEnd">): boolean {
    return admin.plan === "PRO" && (!admin.currentPeriodEnd || admin.currentPeriodEnd > new Date())
}

// What other people (clients, magic link visitors) get to see. null is Freelansite defaults.
export function getPublicBranding(
    admin: Pick<Admin, "name" | "businessName" | "plan" | "currentPeriodEnd" | "brandPrimary" | "logoUrl" | "logoStyle">
) {
    if (!isProActive(admin)) return null
    if (!admin.brandPrimary && !admin.logoUrl) return null

    return {
        name: admin.businessName || admin.name,
        primary: admin.brandPrimary,
        logoUrl: admin.logoUrl,
        logoStyle: admin.logoStyle
    }
}

// Extra fields for GET /api/auth/me so Settings knows the plan and current branding
export function getAdminBrandingSettings(
    admin: Pick<Admin, "plan" | "currentPeriodEnd" | "brandPrimary" | "logoUrl" | "logoStyle">
) {
    return {
        plan: isProActive(admin) ? "PRO" : "FREE",
        brandPrimary: admin.brandPrimary,
        logoUrl: admin.logoUrl,
        logoStyle: admin.logoStyle
    }
}

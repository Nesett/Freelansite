import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { X, Check } from "lucide-react"

type ToastType = "error" | "success"

interface Toast {
    id: number
    type: ToastType
    message: string
    duration: number
}

interface ToastContextValue {
    showError: (message: string, duration?: number) => void
    showSuccess: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION = 5000
let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const show = useCallback((type: ToastType, message: string, duration: number) => {
        // an identical toast replaces the existing one (and restarts its timer)
        // instead of stacking, e.g. when React StrictMode runs an effect twice in dev
        setToasts(prev => [
            ...prev.filter(t => !(t.type === type && t.message === message)),
            { id: nextId++, type, message, duration }
        ])
    }, [])

    const value = useMemo<ToastContextValue>(() => ({
        showError: (message, duration = DEFAULT_DURATION) => show("error", message, duration),
        showSuccess: (message, duration = DEFAULT_DURATION) => show("success", message, duration),
    }), [show])

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toastContainer" aria-live="polite">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast--${toast.type}`} role="alert">
                        <div
                            className="toastProgress"
                            style={{ animationDuration: `${toast.duration}ms` }}
                            onAnimationEnd={() => dismiss(toast.id)}
                        />
                        <div className="toastHeader">
                            <button
                                type="button"
                                className="toastClose"
                                onClick={() => dismiss(toast.id)}
                                aria-label="Dismiss"
                            >
                                {toast.type === "error" ? <X size={16} /> : <Check size={16} />}
                            </button>
                            <span>{toast.type === "error" ? "Error" : "Success"}</span>
                        </div>
                        <p className="toastMessage">{toast.message}</p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)

    if (!ctx) {
        throw new Error("useToast must be used inside <ToastProvider>")
    }

    return ctx
}
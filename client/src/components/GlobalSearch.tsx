import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, FolderKanban, Receipt, type LucideIcon } from 'lucide-react'
import useClickOutside from '../utils/clicksOutside'
import { useAuth } from '../context/AuthContext'

type SearchResults = {
    clients: { id: string, name: string | null, companyName: string | null, email: string }[]
    projects: { id: string, title: string, clientName: string }[]
    invoices: { id: string, number: number, clientName: string, projectTitle: string }[]
}

type ResultItem = {
    key: string
    group: 'Clients' | 'Projects' | 'Invoices'
    to: string
    icon: LucideIcon
    title: string
    subtitle: string
}

const MIN_QUERY_LENGTH = 2

function highlight(text: string, query: string): ReactNode {
    const term = query.trim()
    if (!term) return text

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

    return parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase()
            ? <mark key={i} className="searchHighlight">{part}</mark>
            : part
    )
}

function formatInvoiceNumber(number: number) {
    return `#${String(number).padStart(3, '0')}`
}

function buildItems(results: SearchResults | null): ResultItem[] {
    if (!results) return []

    const clients: ResultItem[] = results.clients.map(client => {
        const title = client.companyName || client.name || client.email

        return {
            key: `client-${client.id}`,
            group: 'Clients',
            to: `/clients/${client.id}`,
            icon: Users,
            title,
            subtitle: title === client.email ? '' : client.email
        }
    })

    const projects: ResultItem[] = results.projects.map(project => ({
        key: `project-${project.id}`,
        group: 'Projects',
        to: `/projects/${project.id}`,
        icon: FolderKanban,
        title: project.title,
        subtitle: project.clientName
    }))

    const invoices: ResultItem[] = results.invoices.map(invoice => ({
        key: `invoice-${invoice.id}`,
        group: 'Invoices',
        to: `/invoices/${invoice.id}`,
        icon: Receipt,
        title: formatInvoiceNumber(invoice.number),
        subtitle: `${invoice.projectTitle} for ${invoice.clientName}`
    }))

    return [...clients, ...projects, ...invoices]
}

export default function GlobalSearch() {
    const [query, setQuery] = useState<string>('')
    const [open, setOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [hasError, setHasError] = useState<boolean>(false)
    const [results, setResults] = useState<SearchResults | null>(null)
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const navigate = useNavigate()
    const { user } = useAuth()
    const isClient = user?.role === 'client'
    const placeholder = isClient ? 'Search projects, invoices…' : 'Search clients, projects…'

    useClickOutside(open, () => setOpen(false), containerRef)

    const term = query.trim()
    const items = useMemo(() => buildItems(results), [results])
    const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
                inputRef.current?.select()
                setOpen(true)
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    // Debounced search, stale requests are aborted
    useEffect(() => {
        if (term.length < MIN_QUERY_LENGTH) {
            setResults(null)
            setLoading(false)
            setHasError(false)
            return
        }

        const controller = new AbortController()
        setLoading(true)

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
                    credentials: 'include',
                    signal: controller.signal
                })

                if (!res.ok) {
                    throw new Error('Search failed.')
                }

                const data = await res.json()

                setResults({
                    clients: data.clients ?? [],
                    projects: data.projects ?? [],
                    invoices: data.invoices ?? []
                })
                setActiveIndex(0)
                setHasError(false)
                setLoading(false)
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return
                setHasError(true)
                setLoading(false)
            }
        }, 250)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [term])

    // Keep the keyboard-selected result visible
    useEffect(() => {
        document.getElementById(`search-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex])

    function goTo(item: ResultItem) {
        navigate(item.to)
        setOpen(false)
        setQuery('')
        setResults(null)
        inputRef.current?.blur()
    }

    function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
            return
        }

        if (items.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActiveIndex(prev => (prev + 1) % items.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(prev => (prev - 1 + items.length) % items.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            goTo(items[activeIndex])
        }
    }

    const showPanel = open && term.length > 0

    let panelContent: ReactNode

    if (term.length < MIN_QUERY_LENGTH) {
        panelContent = <p className="searchStatus">Keep typing to search…</p>
    } else if (hasError) {
        panelContent = <p className="searchStatus">Search is unavailable right now.</p>
    } else if (items.length === 0 && loading) {
        panelContent = <p className="searchStatus">Searching…</p>
    } else if (items.length === 0) {
        panelContent = <p className="searchStatus">No results for “{term}”</p>
    } else {
        panelContent = (
            <div id="global-search-list" role="listbox">
                {items.map((item, index) => {
                    const Icon = item.icon
                    const showGroupLabel = index === 0 || items[index - 1].group !== item.group
                    const highlightTerm = item.group === 'Invoices' ? term.replace(/^#/, '') : term

                    return (
                        <Fragment key={item.key}>
                            {showGroupLabel && (
                                <p className="searchGroupLabel" role="presentation">{item.group}</p>
                            )}
                            <button
                                id={`search-option-${index}`}
                                type="button"
                                role="option"
                                aria-selected={index === activeIndex}
                                className={index === activeIndex ? 'searchOption searchOption--active' : 'searchOption'}
                                onMouseDown={e => e.preventDefault()}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => goTo(item)}
                            >
                                <span className="searchOptionIcon"><Icon size={16} /></span>
                                <span className="searchOptionText">
                                    <span className="searchOptionTitle">{highlight(item.title, highlightTerm)}</span>
                                    {item.subtitle && (
                                        <span className="searchOptionSubtitle">{highlight(item.subtitle, term)}</span>
                                    )}
                                </span>
                            </button>
                        </Fragment>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="topbarSearch" ref={containerRef}>
            <div className="topbarSearchField">
                <Search size={16} aria-hidden="true" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    placeholder={placeholder}
                    role="combobox"
                    aria-label={isClient ? 'Search projects and invoices' : 'Search clients, projects and invoices'}
                    aria-expanded={showPanel}
                    aria-controls="global-search-list"
                    aria-autocomplete="list"
                    aria-activedescendant={items.length > 0 ? `search-option-${activeIndex}` : undefined}
                    autoComplete="off"
                    onChange={e => {
                        setQuery(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                />
                {query === '' && <kbd className="searchKbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>}
            </div>

            {showPanel && <div className="searchPanel">{panelContent}</div>}
        </div>
    )
}
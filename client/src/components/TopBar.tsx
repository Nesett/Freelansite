import Breadcrumbs from './Breadcrumbs'
import GlobalSearch from './GlobalSearch'
import StudioMenu from './Studiomenu'

export default function TopBar() {
    return (
        <header className="topbar">
            <Breadcrumbs />
            <GlobalSearch />
            <StudioMenu />
        </header>
    )
}
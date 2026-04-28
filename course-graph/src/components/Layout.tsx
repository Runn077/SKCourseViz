import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCollegeColor } from '../utils/collegeColor'

type CourseNode = {
    class_name: string
    college: string
    title: string
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate()
    const location = useLocation()

    const [query, setQuery] = useState('')
    const [showResults, setShowResults] = useState(false)
    const [courses, setCourses] = useState<CourseNode[]>([])
    const searchRef = useRef<HTMLDivElement>(null)
    const [visibleResults, setVisibleResults] = useState(10);

    // HashRouter exposes the current route in location.pathname.
    const activePath = location.pathname.replace(/\/+$/, '') || '/'
    const activeTab = activePath.startsWith('/course')
        ? null
        : activePath === '/heatmap'
        ? 'heatmap'
        : activePath === '/list'
        ? 'list'
        : 'graph'

    useEffect(() => {
        setVisibleResults(10);
    }, [query]);

    useEffect(() => {
        fetch('./data/courses_with_ratings.json')
            .then(res => res.json())
            .then(data => setCourses(data))
    }, [])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as globalThis.Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const results = query.trim().length > 0
        ? courses.filter(c => c.class_name.toLowerCase().startsWith(query.toLowerCase())).slice(0, visibleResults)
        : []

    const handleSelect = (classname: string) => {
        setQuery('')
        setShowResults(false)
        window.open(`#/course/${classname}`, '_blank')
    }

    const handleScrollSearch = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            setVisibleResults(prev => prev + 10)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>

            {/* Top navbar */}
            <div style={{
                height: '48px',
                background: '#006341',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: '16px',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
                {/* Logo */}
                <div
                    onClick={() => navigate('/')}
                    style={{
                        fontFamily: 'Times New Roman, serif',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.02em',
                    }}
                >
                    UofSViz
                </div>

                {/* Search bar */}
                <div ref={searchRef} style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search for a course..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setShowResults(true) }}
                        onFocus={() => setShowResults(true)}
                        style={{
                            width: '100%',
                            padding: '6px 12px',
                            borderRadius: '5px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.15)',
                            color: '#fff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            outline: 'none',
                        }}
                    />
                    {/* Placeholder color fix */}
                    <style>{`input::placeholder { color: rgba(255,255,255,0.6); }`}</style>

                    {/* Dropdown results */}
                    {showResults && results.length > 0 && (
                        <div onScroll={handleScrollSearch} style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '5px',
                            marginTop: '4px',
                            maxHeight: '280px',
                            overflowY: 'auto',
                            zIndex: 1000,
                        }}>
                            {results.map(c => (
                                <div
                                    key={c.class_name}
                                    onMouseDown={() => handleSelect(c.class_name)}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        borderBottom: '1px solid var(--bg-hover)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: 'var(--text-primary)',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{
                                        width: '8px', height: '8px',
                                        borderRadius: '50%', flexShrink: 0,
                                        background: getCollegeColor(c.college),
                                    }} />
                                    <span style={{ fontWeight: 600 }}>{c.class_name}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab navbar */}
            <div style={{
                height: '40px',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '20px',
                gap: '4px',
                flexShrink: 0,
                borderBottom: '1px solid var(--border)',
            }}>
                {(['graph', 'heatmap', 'list'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => navigate(tab === 'graph' ? '/' : `/${tab}`)}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #DBCC52' : '2px solid transparent',
                            color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                            fontSize: '13px',
                            fontWeight: activeTab === tab ? 600 : 400,
                            cursor: 'pointer',
                            padding: '0 12px',
                            height: '100%',
                            textTransform: 'capitalize',
                            transition: 'color 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text-secondary)' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Page content */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </div>
    )
}
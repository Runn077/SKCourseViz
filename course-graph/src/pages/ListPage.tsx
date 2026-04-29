import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCollegeColor } from '../utils/collegeColor'

type Course = {
    class_name: string
    title: string
    college: string
    department: string
    subject_code: string
    credits: string
    avg_quality: number | null
    avg_difficulty: number | null
    num_reviews: number
}

type SortField = 'quality' | 'difficulty' | 'reviews' | 'name'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

function StatBadge({ label, value }: { label: string, value: string | number | null }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            minWidth: '56px',
        }}>
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: value === null ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {value === null ? 'N/A' : typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {label}
            </span>
        </div>
    )
}

export default function ListPage() {
    const navigate = useNavigate()
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    // Sort state
    const [sortField, setSortField] = useState<SortField>('quality')
    const [sortDir, setSortDir] = useState<SortDir>('desc')

    // Filter state
    const [filterCollege, setFilterCollege] = useState('all')
    const [filterDepartment, setFilterDepartment] = useState('all')
    const [filterSubject, setFilterSubject] = useState('all')
    const [filterLevel, setFilterLevel] = useState('all')
    const [filterCredits, setFilterCredits] = useState('all')
    const [filterHasReviews, setFilterHasReviews] = useState<'all' | 'yes' | 'no'>('all')

    // Pagination
    const [page, setPage] = useState(1)

    useEffect(() => {
        fetch('./data/courses_with_ratings.json')
            .then(res => res.json())
            .then(data => {
                setCourses(data)
                setLoading(false)
            })
    }, [])

    // Reset to page 1 when filters or sort changes
    useEffect(() => {
        setPage(1)
    }, [sortField, sortDir, filterCollege, filterDepartment, filterSubject, filterLevel, filterCredits, filterHasReviews])

    // Unique filter options
    const colleges = useMemo(() => ['all', ...Array.from(new Set(courses.map(c => c.college))).sort()], [courses])
    const departments = useMemo(() => ['all', ...Array.from(new Set(courses.map(c => c.department))).sort()], [courses])
    const subjects = useMemo(() => ['all', ...Array.from(new Set(courses.map(c => c.subject_code))).sort()], [courses])
    const levels = ['all', '0', '100', '200', '300', '400', '500', '600', '700', '800', '900']
    const credits = useMemo(() => ['all', ...Array.from(new Set(courses.map(c => c.credits))).sort()], [courses])

    // Get course level from course number e.g. CMPT145 -> 100
    const getCourseLevel = (className: string) => {
        const match = className.match(/(\d+)/)
        if (!match) return null
        return Math.floor(parseInt(match[1]) / 100) * 100
    }

    // Filter courses
    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            if (filterCollege !== 'all' && c.college !== filterCollege) return false
            if (filterDepartment !== 'all' && c.department !== filterDepartment) return false
            if (filterSubject !== 'all' && c.subject_code !== filterSubject) return false
            if (filterLevel !== 'all') {
                const level = getCourseLevel(c.class_name)
                if (level !== parseInt(filterLevel)) return false
            }
            if (filterCredits !== 'all' && c.credits !== filterCredits) return false
            if (filterHasReviews === 'yes' && c.num_reviews === 0) return false
            if (filterHasReviews === 'no' && c.num_reviews > 0) return false
            return true
        })
    }, [courses, filterCollege, filterDepartment, filterSubject, filterLevel, filterCredits, filterHasReviews])

    const resetFilters = () => {
        setFilterCollege('all')
        setFilterDepartment('all')
        setFilterSubject('all')
        setFilterLevel('all')
        setFilterCredits('all')
        setFilterHasReviews('all')
        setSortField('quality')
        setSortDir('desc')
        setPage(1)
    }

    // Sort courses, courses with no reviews go to bottom
    const sortedCourses = useMemo(() => {
        return [...filteredCourses].sort((a, b) => {
            const aHasReviews = a.num_reviews > 0
            const bHasReviews = b.num_reviews > 0

            if (aHasReviews && !bHasReviews) return -1
            if (!aHasReviews && bHasReviews) return 1

            if (!aHasReviews && !bHasReviews) {
                return a.class_name.localeCompare(b.class_name)
            }

            const dir = sortDir === 'asc' ? 1 : -1

            let primary = 0

            if (sortField === 'quality') {
                primary = ((a.avg_quality ?? 0) - (b.avg_quality ?? 0)) * dir
            } else if (sortField === 'difficulty') {
                primary = ((a.avg_difficulty ?? 0) - (b.avg_difficulty ?? 0)) * dir
            } else if (sortField === 'reviews') {
                primary = (a.num_reviews - b.num_reviews) * dir
            } else if (sortField === 'name') {
                primary = a.class_name.localeCompare(b.class_name) * dir
            }

            // If primary sort is a tie, use num_reviews descending as tiebreaker
            // Exception: if already sorting by reviews, use quality as tiebreaker instead
            if (primary !== 0) return primary

            if (sortField === 'reviews') {
                return (b.avg_quality ?? 0) - (a.avg_quality ?? 0)
            }
            return b.num_reviews - a.num_reviews
        })
    }, [filteredCourses, sortField, sortDir])

    const totalPages = Math.ceil(sortedCourses.length / PAGE_SIZE)
    const pageStart = (page - 1) * PAGE_SIZE
    const visibleCourses = sortedCourses.slice(pageStart, pageStart + PAGE_SIZE)

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            // Default direction per field
            setSortDir(field === 'name' ? 'asc' : 'desc')
        }
    }

    const sortLabel = (field: SortField, label: string) => {
        const active = sortField === field
        const arrow = sortDir === 'desc' ? ' ↓' : ' ↑'
        return (
            <button
                onClick={() => handleSort(field)}
                style={{
                    background: active ? 'var(--bg-hover)' : 'none',
                    border: '1px solid var(--border)',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                    fontWeight: active ? 600 : 400,
                }}
            >
                {label}{active ? arrow : ''}
            </button>
        )
    }

    if (loading) return (
        <div style={{ color: 'var(--text-primary)', padding: '32px' }}>Loading...</div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100%' }}>

            {/* Filter/sort bar */}
            <div style={{
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                padding: '10px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0,
            }}>
                {/* Row 1 — Sort */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort:</span>
                    {sortLabel('quality', 'Quality')}
                    {sortLabel('difficulty', 'Difficulty')}
                    {sortLabel('reviews', 'Reviews')}
                    {sortLabel('name', 'Name')}
                </div>

                {/* Row 2 — Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter:</span>

                    {/* College */}
                    <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={selectStyle}>
                        {colleges.map(c => <option key={c} value={c}>{c === 'all' ? 'All Colleges' : c}</option>)}
                    </select>

                    {/* Department */}
                    <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} style={selectStyle}>
                        {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                    </select>

                    {/* Subject */}
                    <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={selectStyle}>
                        {subjects.map(s => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}
                    </select>

                    {/* Level */}
                    <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={selectStyle}>
                        {levels.map(l => (
                            <option key={l} value={l}>
                                {l === 'all' ? 'All Levels' : l === '0' ? 'Under 100' : `${l}-level`}
                            </option>
                        ))}
                    </select>

                    {/* Credits */}
                    <select
                    value={filterCredits}
                    onChange={e => setFilterCredits(e.target.value)}
                    style={selectStyle}
                    >
                    {credits
                        .sort((a, b) => {
                        if (a === 'all') return -1
                        if (b === 'all') return 1
                        return Number(a) - Number(b)
                        })
                        .map(c => (
                        <option key={c} value={c}>
                            {c === 'all' ? 'All Credits' : `${c} credits`}
                        </option>
                        ))}
                    </select>

                    {/* Has reviews */}
                    <select value={filterHasReviews} onChange={e => setFilterHasReviews(e.target.value as 'all' | 'yes' | 'no')} style={selectStyle}>
                        <option value="all">All Courses</option>
                        <option value="yes">Has Reviews</option>
                        <option value="no">No Reviews</option>
                    </select>

                    {/* Reset button, only show if any filter is active */}
                    {(filterCollege !== 'all' || filterDepartment !== 'all' || filterSubject !== 'all' ||
                    filterLevel !== 'all' || filterCredits !== 'all' || filterHasReviews !== 'all') && (
                        <button
                            onClick={resetFilters}
                            style={{
                                background: 'none',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 10px',
                                fontSize: 'var(--font-size-sm)',
                                cursor: 'pointer',
                            }}
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <div style={{ padding: '10px 20px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', flexShrink: 0 }}>
                {sortedCourses.length} courses · Page {page} of {totalPages}
            </div>

            {/* Course cards */}
            <div style={{ flex: 1, padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visibleCourses.map((course, i) => {
                    const placement = pageStart + i + 1
                    const collegeColor = getCollegeColor(course.college)

                    return (
                        <div
                            key={course.class_name}
                            onClick={() => navigate(`/course/${course.class_name}`)}
                            style={{
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                cursor: 'pointer',
                                borderLeft: `3px solid ${collegeColor}`,
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                        >
                            {/* Placement number */}
                            <div style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--text-muted)',
                                fontWeight: 600,
                                minWidth: '32px',
                                textAlign: 'right',
                                flexShrink: 0,
                            }}>
                                #{placement}
                            </div>

                            {/* Course info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
                                        {course.class_name}
                                    </span>
                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {course.title}
                                    </span>
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '3px' }}>
                                    {course.college} · {course.department}
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <StatBadge label="Quality" value={course.avg_quality} />
                                <StatBadge label="Difficulty" value={course.avg_difficulty} />
                                <StatBadge label="Reviews" value={course.num_reviews === 0 ? null : course.num_reviews} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '16px 20px',
                    flexShrink: 0,
                    flexWrap: 'wrap',
                }}>
                    {/* Previous */}
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{ ...pageButtonStyle, opacity: page === 1 ? 0.4 : 1 }}
                    >
                        ←
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                        .reduce<(number | string)[]>((acc, p, idx, arr) => {
                            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                            acc.push(p)
                            return acc
                        }, [])
                        .map((p, i) => p === '...'
                            ? <span key={`ellipsis-${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>
                            : <button
                                key={p}
                                onClick={() => setPage(p as number)}
                                style={{
                                    ...pageButtonStyle,
                                    background: page === p ? 'var(--accent, #006341)' : 'var(--bg-hover)',
                                    color: page === p ? '#fff' : 'var(--text-secondary)',
                                    fontWeight: page === p ? 700 : 400,
                                }}
                            >
                                {p}
                            </button>
                        )
                    }

                    {/* Next */}
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{ ...pageButtonStyle, opacity: page === totalPages ? 0.4 : 1 }}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    )
}

const selectStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-size-sm)',
    cursor: 'pointer',
    outline: 'none',
}

const pageButtonStyle: React.CSSProperties = {
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)',
    minWidth: '32px',
}
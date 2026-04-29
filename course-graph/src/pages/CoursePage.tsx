import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCollegeColor } from '../utils/collegeColor'

type Review = {
    professor_name: string
    professor_id: number
    quality: number | null
    difficulty: number | null
    date: string
    comment: string
    grade?: string
    for_credit?: string
    attendance?: string
    would_take_again?: string
    tags: string[]
}

type Professor = {
    name: string
    id: number
    overall_rating: number | null
    difficulty: number | null
    would_take_again: string | null
    num_ratings: number
}

type Course = {
    class_name: string
    title: string
    description: string
    notes?: string
    college: string
    department: string
    subject_code: string
    credits: string
    offered?: string
    weekly_hours?: string
    prerequisite: string[]
    link: string
    avg_quality: number | null
    avg_difficulty: number | null
    num_reviews: number
    professors: Professor[]
    reviews: Review[]
}

type SortOption = 'date_newest' | 'date_oldest' | 'quality_highest' | 'quality_lowest'

const REVIEWS_PER_PAGE = 5

function CoursePage() {
    const { courseId } = useParams()

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    // Sort and filter state
    const [sortBy, setSortBy] = useState<SortOption>('date_newest')
    const [selectedProfessor, setSelectedProfessor] = useState<string>('all')

    useEffect(() => {
        fetch('./data/courses_with_ratings.json')
            .then(res => res.json())
            .then((data: Course[]) => {
                const found = data.find(c => c.class_name === courseId)
                setCourse(found ?? null)
                setLoading(false)
            })
    }, [courseId])

    if (loading) return (
        <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading...
        </div>
    )

    if (!course) return (
        <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Course not found.
        </div>
    )

    const collegeColor = getCollegeColor(course.college)

    // Filter by professor
    const filteredReviews = selectedProfessor === 'all'
        ? course.reviews
        : course.reviews.filter(r => r.professor_name === selectedProfessor)
    

    // Fix Date format
    const parseDate = (dateStr: string) => {
        // Remove st, nd, rd, th suffixes e.g. "Apr 21st, 2026" -> "Apr 21, 2026"
        const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1')
        return new Date(cleaned).getTime()
    }    
    // Sort the filtered reviews
    const sortedReviews = [...filteredReviews].sort((a, b) => {
        if (sortBy === 'date_newest') return parseDate(b.date) - parseDate(a.date)
        if (sortBy === 'date_oldest') return parseDate(a.date) - parseDate(b.date)
        if (sortBy === 'quality_highest') return (b.quality ?? 0) - (a.quality ?? 0)
        if (sortBy === 'quality_lowest') return (a.quality ?? 0) - (b.quality ?? 0)
        return 0
    })

    // Paginate
    // page 1 shows 0-4, page 2 shows 0-9, etc
    const visibleReviews = sortedReviews.slice(0, page * REVIEWS_PER_PAGE)
    const hasMore = visibleReviews.length < sortedReviews.length
    const sanitizedNoteLines = (course.notes ?? '')
        .split('\n')
        .map(line => line.trimEnd())
        .filter(line => {
            const normalized = line.trim().toLowerCase()
            if (normalized === 'weekly hours:') return false
            if (/^\d+\s+lecture hours$/i.test(line.trim())) return false
            return true
        })
    const noteLines = sanitizedNoteLines.reduce<string[]>((acc, line) => {
        const isEmpty = line.trim().length === 0
        if (isEmpty && (acc.length === 0 || acc[acc.length - 1].trim().length === 0)) {
            return acc
        }
        acc.push(line)
        return acc
    }, [])

    const renderLinkedNoteLine = (line: string) => {
        const courseCodeRegex = /\b([A-Z]{2,4})\s?(\d{3})\b/g
        const parts: React.ReactNode[] = []
        let lastIndex = 0
        let match: RegExpExecArray | null

        while ((match = courseCodeRegex.exec(line)) !== null) {
            const [fullMatch, subject, number] = match
            const start = match.index
            const end = start + fullMatch.length

            if (start > lastIndex) {
                parts.push(line.slice(lastIndex, start))
            }

            const normalizedCode = `${subject}${number}`
            parts.push(
                <span
                    key={`${normalizedCode}-${start}`}
                    onClick={() => window.open(`#/course/${normalizedCode}`, '_blank')}
                    style={{
                        color: '#DBCC52',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 600,
                    }}
                >
                    {fullMatch}
                </span>
            )

            lastIndex = end
        }

        if (lastIndex < line.length) {
            parts.push(line.slice(lastIndex))
        }

        return parts.length > 0 ? parts : line
    }

    return (
        <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', width: '100%', padding: '32px',boxSizing: 'border-box',}}>
            {/* College color bar */}
            <div style={{ width: '40px', height: '4px', borderRadius: 'var(--radius-sm)', background: collegeColor, marginBottom: '12px' }} />

            {/* Course title */}
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '6px', fontFamily: "Times New Roman" }}>
                {course.title}
            </h1>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span>{course.college}</span>
                <span>·</span>
                <span>{course.department}</span>
                <span>·</span>
                <span>{course.credits} credits</span>
                {course.offered && <><span>·</span><span>{course.offered}</span></>}
            </div>

            {/* Rating summary */}
            {course.num_reviews > 0 && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: collegeColor }}>{course.avg_quality?.toFixed(1)}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>Avg Quality</div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: collegeColor }}>{course.avg_difficulty?.toFixed(1)}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>Avg Difficulty</div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: collegeColor }}>{course.num_reviews}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>Reviews</div>
                    </div>
                </div>
            )}

            {/* Description */}
            <div style={{ fontSize: 'var(--font-size-md)', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '24px' }}>
                {course.description}
            </div>

            {/* Notes */}
            {noteLines.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Course Notes: 
                    </div>
                    <div
                        style={{
                            fontSize: 'var(--font-size-md)',
                            lineHeight: 1.7,
                            color: 'var(--text-primary)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 14px',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {noteLines.map((line, idx) => {
                            const trimmed = line.trim()
                            const prev = idx > 0 ? noteLines[idx - 1].trim() : ''
                            const isEmpty = trimmed.length === 0
                            const isHeaderLine = /:$/.test(trimmed)
                            const isIndented = !isEmpty && !isHeaderLine && (prev.endsWith(':') || /^note:/i.test(prev))

                            if (isEmpty) {
                                return <div key={`spacer-${idx}`} style={{ height: 4 }} />
                            }

                            return (
                                <div
                                    key={`${line}-${idx}`}
                                    style={{
                                        marginBottom: idx === noteLines.length - 1 ? 0 : 2,
                                        paddingLeft: isIndented ? 12 : 0,
                                    }}
                                >
                                    {renderLinkedNoteLine(trimmed)}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Link to USask catalogue */}
            <a
                href={course.link}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginBottom: '32px', padding: '8px 16px', background: collegeColor, color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', fontWeight: 600, textDecoration: 'none' }}
            >
                View on USask Catalogue
            </a>

            {/* Professors */}
            {course.professors.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Professors
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {course.professors.map(prof => (
                            <div
                                key={prof.id}
                                onClick={() => window.open(`https://www.ratemyprofessors.com/professor/${prof.id}`, '_blank')}
                                style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{prof.name}</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>{prof.num_ratings} ratings on Rate My Professors</div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: collegeColor }}>{prof.overall_rating?.toFixed(1) ?? 'N/A'}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Quality</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: collegeColor }}>{prof.difficulty?.toFixed(1) ?? 'N/A'}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Difficulty</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews section */}
            <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Reviews
                </div>

                {/* Filter bar */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {/* Sort dropdown */}
                    <select
                        value={sortBy}
                        onChange={e => { setSortBy(e.target.value as SortOption); setPage(1); }}
                        style={{ padding: '7px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="date_newest">Date: Newest First</option>
                        <option value="date_oldest">Date: Oldest First</option>
                        <option value="quality_highest">Quality: Highest First</option>
                        <option value="quality_lowest">Quality: Lowest First</option>
                    </select>

                    {/* Professor dropdown */}
                    {course.professors.length > 1 && (
                        <select
                            value={selectedProfessor}
                            onChange={e => { setSelectedProfessor(e.target.value); setPage(1); }}
                            style={{ padding: '7px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="all">All Professors</option>
                            {course.professors.map(prof => (
                                <option key={prof.id} value={prof.name}>{prof.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* No reviews message */}
                {sortedReviews.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No reviews for this selection.</div>
                )}

                {/* Review cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {visibleReviews.map((review, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px' }}>

                            {/* Review header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{review.professor_name}</div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{review.date}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', textAlign: 'center' }}>
                                    {review.quality !== null && (
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: collegeColor }}>{review.quality.toFixed(1)}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Quality</div>
                                        </div>
                                    )}
                                    {review.difficulty !== null && (
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: collegeColor }}>{review.difficulty.toFixed(1)}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Difficulty</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meta info */}
                            <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '10px', flexWrap: 'wrap' }}>
                                {review.grade && <span>Grade: {review.grade}</span>}
                                {review.for_credit && <span>For Credit: {review.for_credit}</span>}
                                {review.attendance && <span>Attendance: {review.attendance}</span>}
                                {review.would_take_again && <span>Take Again: {review.would_take_again}</span>}
                            </div>

                            {/* Comment */}
                            {review.comment && (
                                <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '10px' }}>
                                    {review.comment}
                                </div>
                            )}

                            {/* Tags */}
                            {review.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {review.tags.map((tag, j) => (
                                        <span key={j} style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Load more button */}
                {hasMore && (
                    <button
                        onClick={() => setPage(p => p + 1)}
                        style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}
                    >
                        Load More Reviews ({sortedReviews.length - visibleReviews.length} remaining)
                    </button>
                )}
            </div>
        </div>
    )
}

export default CoursePage
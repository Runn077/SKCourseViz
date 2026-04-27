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
        <div style={{ background: '#1a1a2e', color: '#f0f0f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading...
        </div>
    )

    if (!course) return (
        <div style={{ background: '#1a1a2e', color: '#f0f0f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

    return (
        <div style={{ background: '#1a1a2e', color: '#f0f0f0', minHeight: '100vh', width: '100%', padding: '32px',boxSizing: 'border-box',}}>

            {/* Close button */}
            <button
                onClick={() => window.close()}
                style={{ background: 'none', border: '1px solid #3a3a5c', color: '#aaa', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', marginBottom: '24px', fontSize: '13px' }}
            >
                ← Close
            </button>

            {/* College color bar */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: collegeColor, marginBottom: '12px' }} />

            {/* Course title */}
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
                {course.title}
            </h1>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#aaa', marginBottom: '20px', flexWrap: 'wrap' }}>
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
                    <div style={{ background: '#12122a', borderRadius: '8px', padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: collegeColor }}>{course.avg_quality?.toFixed(1)}</div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>Avg Quality</div>
                    </div>
                    <div style={{ background: '#12122a', borderRadius: '8px', padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: collegeColor }}>{course.avg_difficulty?.toFixed(1)}</div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>Avg Difficulty</div>
                    </div>
                    <div style={{ background: '#12122a', borderRadius: '8px', padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: collegeColor }}>{course.num_reviews}</div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>Reviews</div>
                    </div>
                </div>
            )}

            {/* Description */}
            <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#ddd', marginBottom: '24px' }}>
                {course.description}
            </div>

            {/* Prerequisites */}
            {course.prerequisite.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '8px' }}>
                        Prerequisites
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', cursor: 'pointer' }}>
                        {course.prerequisite.map(p => (
                            <span key={p} 
                                onClick={() => window.open(`#/course/${p}`, '_blank')} 
                                style={{ background: '#2a2a4a', border: '1px solid #3a3a5c', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', fontWeight: 600 }}>
                                {p}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Link to USask catalogue */}
            <a
                href={course.link}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginBottom: '32px', padding: '8px 16px', background: collegeColor, color: '#fff', borderRadius: '5px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
            >
                View on USask Catalogue
            </a>

            {/* Professors */}
            {course.professors.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '12px' }}>
                        Professors
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {course.professors.map(prof => (
                            <div
                                key={prof.id}
                                onClick={() => window.open(`https://www.ratemyprofessors.com/professor/${prof.id}`, '_blank')}
                                style={{ background: '#12122a', borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{prof.name}</div>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{prof.num_ratings} ratings on Rate My Professors</div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: collegeColor }}>{prof.overall_rating?.toFixed(1) ?? 'N/A'}</div>
                                        <div style={{ fontSize: '10px', color: '#aaa' }}>Quality</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: collegeColor }}>{prof.difficulty?.toFixed(1) ?? 'N/A'}</div>
                                        <div style={{ fontSize: '10px', color: '#aaa' }}>Difficulty</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews section */}
            <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '12px' }}>
                    Reviews
                </div>

                {/* Filter bar */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {/* Sort dropdown */}
                    <select
                        value={sortBy}
                        onChange={e => { setSortBy(e.target.value as SortOption); setPage(1); }}
                        style={{ padding: '7px 10px', borderRadius: '5px', border: '1px solid #3a3a5c', background: '#12122a', color: '#f0f0f0', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
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
                            style={{ padding: '7px 10px', borderRadius: '5px', border: '1px solid #3a3a5c', background: '#12122a', color: '#f0f0f0', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
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
                    <div style={{ color: '#666', fontSize: '13px' }}>No reviews for this selection.</div>
                )}

                {/* Review cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {visibleReviews.map((review, i) => (
                        <div key={i} style={{ background: '#12122a', borderRadius: '6px', padding: '16px' }}>

                            {/* Review header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{review.professor_name}</div>
                                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{review.date}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', textAlign: 'center' }}>
                                    {review.quality !== null && (
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: collegeColor }}>{review.quality.toFixed(1)}</div>
                                            <div style={{ fontSize: '10px', color: '#aaa' }}>Quality</div>
                                        </div>
                                    )}
                                    {review.difficulty !== null && (
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: collegeColor }}>{review.difficulty.toFixed(1)}</div>
                                            <div style={{ fontSize: '10px', color: '#aaa' }}>Difficulty</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meta info */}
                            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#888', marginBottom: '10px', flexWrap: 'wrap' }}>
                                {review.grade && <span>Grade: {review.grade}</span>}
                                {review.for_credit && <span>For Credit: {review.for_credit}</span>}
                                {review.attendance && <span>Attendance: {review.attendance}</span>}
                                {review.would_take_again && <span>Take Again: {review.would_take_again}</span>}
                            </div>

                            {/* Comment */}
                            {review.comment && (
                                <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#ddd', marginBottom: '10px' }}>
                                    {review.comment}
                                </div>
                            )}

                            {/* Tags */}
                            {review.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {review.tags.map((tag, j) => (
                                        <span key={j} style={{ background: '#2a2a4a', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#aaa' }}>
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
                        style={{ marginTop: '16px', width: '100%', padding: '10px', background: '#2a2a4a', border: '1px solid #3a3a5c', color: '#f0f0f0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        Load More Reviews ({sortedReviews.length - visibleReviews.length} remaining)
                    </button>
                )}
            </div>
        </div>
    )
}

export default CoursePage
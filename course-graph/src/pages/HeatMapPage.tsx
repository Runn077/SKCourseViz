import { useEffect, useState, useMemo } from 'react'
import HeatmapSidebar from '../components/HeatmapSidebar'
import Heatmap from '../components/Heatmap'

type Course = {
    class_name: string
    title: string
    college: string
    department: string
    subject_code: string
    avg_quality: number | null
    avg_difficulty: number | null
    num_reviews: number
}

const MIN_REVIEWS = 3

const legendStops = [
    { color: '#c0392b', label: '1.0' },
    { color: '#e67e22', label: '2.0' },
    { color: '#f1c40f', label: '3.0' },
    { color: '#2ecc71', label: '4.0' },
    { color: '#27ae60', label: '5.0' },
]

export default function HeatmapPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<string>('top500')

    useEffect(() => {
        fetch('./data/courses_with_ratings.json')
            .then(res => res.json())
            .then(data => {
                setCourses(data)
                setLoading(false)
            })
    }, [])

    const filteredCourses = useMemo(() =>
        courses.filter(c => c.num_reviews >= MIN_REVIEWS)
    , [courses])

    const colleges = useMemo(() =>
        [...new Set(filteredCourses.map(c => c.college))].sort()
    , [filteredCourses])

    const top500 = useMemo(() =>
        [...filteredCourses]
            .sort((a, b) => b.num_reviews - a.num_reviews)
            .slice(0, 500)
    , [filteredCourses])

    const selectedCourses = useMemo(() => {
        if (selected === 'top500') return top500
        return filteredCourses.filter(c => c.college === selected)
    }, [selected, filteredCourses, top500])

    if (loading) return (
        <div style={{ color: 'var(--text-primary)', padding: '32px' }}>Loading...</div>
    )

    return (
        <div style={{ display: 'flex', flex: 1, minHeight: '100%' }}>
            <HeatmapSidebar
                colleges={colleges}
                selected={selected}
                onSelect={setSelected}
            />

            {/* Main area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    paddingBottom: '84px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    minHeight: 0,
                }}
            >

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
                    <div>
                        <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 'var(--font-size-xl)' }}>
                            {selected === 'top500' ? 'Top 500 Most Reviewed Courses' : selected}
                        </h2>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                            {selectedCourses.length} courses · min {MIN_REVIEWS} reviews · colored by avg quality
                        </div>
                    </div>

                    {/* Color legend */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginRight: '4px' }}>Quality:</span>
                        {legendStops.map(stop => (
                            <div key={stop.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                <div style={{ width: '24px', height: '12px', background: stop.color, borderRadius: '2px' }} />
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{stop.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Treemap */}
                <div
                    id="heatmap-container"
                    style={{
                        width: '100%',
                        minHeight: '920px',
                        height: 'calc(100vh - 120px)',
                    }}
                >
                    {selectedCourses.length > 0
                        ? <Heatmap courses={selectedCourses} />
                        : <div style={{ color: 'var(--text-muted)', padding: '32px', textAlign: 'center' }}>
                            No courses with enough reviews in this college.
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}
import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'

type Course = {
    class_name: string
    title: string
    college: string
    department: string
    avg_quality: number | null
    avg_difficulty: number | null
    num_reviews: number
}

type Props = {
    courses: Course[]
}

type CourseHierarchyNode = {
    name: string
    children?: CourseHierarchyNode[]
    value?: number
    course?: Course
}

type HoverInfo = {
    course: Course | null
    department: string
    pointer: { x: number; y: number }
}

function getQualityColor(quality: number | null): string {
    if (quality === null) return '#444'
    const scale = d3.scaleLinear<string>()
        .domain([1, 3, 5])
        .range(['#c0392b', '#f1c40f', '#27ae60'])
    return scale(quality)
}

export default function Heatmap({ courses }: Props) {
    const navigate = useNavigate()
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)
    const hoverClearTimeoutRef = useRef<number | null>(null)
    const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity)
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const syncSize = () => {
            const rect = el.getBoundingClientRect()
            const measuredWidth = Math.floor(rect.width)
            const measuredHeight = Math.floor(rect.height)
            setSize({
                width: measuredWidth > 0 ? measuredWidth : 1000,
                height: measuredHeight > 0 ? measuredHeight : 760,
            })
        }
        syncSize()
        const ro = new ResizeObserver(() => {
            syncSize()
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const { width, height } = size

    useEffect(() => {
        return () => {
            if (hoverClearTimeoutRef.current !== null) {
                window.clearTimeout(hoverClearTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const svgElement = svgRef.current
        if (!svgElement || !width || !height) return
        const svgSelection = d3.select(svgElement)
        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 5.5])
            .translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
            .filter((event) => {
                if (event.type === 'dblclick') return false
                return true
            })
            .on('zoom', (event) => {
                setZoomTransform(event.transform)
            })
        zoomBehaviorRef.current = zoomBehavior

        svgSelection.call(zoomBehavior)
        svgSelection.call(zoomBehavior.transform, d3.zoomIdentity)

        return () => {
            svgSelection.on('.zoom', null)
            zoomBehaviorRef.current = null
        }
    }, [width, height, courses])

    const root = useMemo(() => {
        const grouped = d3.group(courses, c => c.department)
        const hierarchy = {
            name: 'root',
            children: Array.from(grouped, ([dept, deptCourses]) => ({
                name: dept,
                children: deptCourses.map(c => ({
                    name: c.class_name,
                    value: Math.max(Math.sqrt(c.num_reviews), 4),
                    course: c,
                }))
            }))
        }
        return d3.hierarchy<CourseHierarchyNode>(hierarchy)
            .sum((d: any) => d.value ?? 0)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    }, [courses])

    const treemap = useMemo(() => {
        if (!width || !height) return null
        return d3.treemap<CourseHierarchyNode>()
            .size([width, height])
            .paddingOuter(4)
            .paddingInner(2)
            .paddingTop(20)
            .round(true)(root)
    }, [root, width, height])

    const leaves = treemap?.leaves() as any[] ?? []
    const deptNodes = treemap?.children as any[] ?? []

    const coursesByDepartment = useMemo(() => {
        const grouped = d3.group(courses, c => c.department)
        return new Map(
            Array.from(grouped, ([department, departmentCourses]) => ([
                department,
                [...departmentCourses].sort((a, b) => b.num_reviews - a.num_reviews),
            ]))
        )
    }, [courses])

    const hoveredDepartmentCourses = hoverInfo
        ? (coursesByDepartment.get(hoverInfo.department) ?? [])
        : []

    const hoverPanelCourses = useMemo(() => {
        if (!hoverInfo) return []
        return [...hoveredDepartmentCourses].sort((a, b) => {
            if (hoverInfo.course) {
                if (a.class_name === hoverInfo.course.class_name) return -1
                if (b.class_name === hoverInfo.course.class_name) return 1
            }
            return b.num_reviews - a.num_reviews
        })
    }, [hoverInfo, hoveredDepartmentCourses])

    const clearHoverSoon = () => {
        if (hoverClearTimeoutRef.current !== null) {
            window.clearTimeout(hoverClearTimeoutRef.current)
        }
        hoverClearTimeoutRef.current = window.setTimeout(() => {
            setHoverInfo(null)
        }, 100)
    }

    const keepHoverActive = () => {
        if (hoverClearTimeoutRef.current !== null) {
            window.clearTimeout(hoverClearTimeoutRef.current)
            hoverClearTimeoutRef.current = null
        }
    }

    const truncateToWidth = (text: string, maxWidth: number, fontSize: number): string => {
        if (maxWidth <= fontSize * 1.5) return ''
        const avgCharWidth = fontSize * 0.64
        const maxChars = Math.floor(maxWidth / avgCharWidth)
        if (maxChars <= 2) return text.slice(0, 1)
        if (text.length <= maxChars) return text
        return `${text.slice(0, Math.max(1, maxChars - 1))}…`
    }

    const getFittedLabelFontSize = (text: string, boxWidth: number, boxHeight: number): number => {
        const horizontalPadding = 12
        const verticalPadding = 8
        const usableWidth = Math.max(0, boxWidth - horizontalPadding)
        const usableHeight = Math.max(0, boxHeight - verticalPadding)
        if (usableWidth <= 0 || usableHeight <= 0 || text.length === 0) return 8
        const widthLimited = usableWidth / (text.length * 0.64)
        const heightLimited = usableHeight * 0.62
        return Math.max(8, Math.min(12, widthLimited, heightLimited))
    }

    const shouldShowClassLabel = (boxWidth: number, boxHeight: number, fittedFontSize: number): boolean => {
        const area = boxWidth * boxHeight
        const MIN_READABLE_FONT = 9
        return boxWidth >= 52 && boxHeight >= 24 && area >= 1700 && fittedFontSize >= MIN_READABLE_FONT
    }

    const shouldShowQualityScore = (boxWidth: number, boxHeight: number): boolean => {
        const area = boxWidth * boxHeight
        return boxWidth >= 96 && boxHeight >= 48 && area >= 5200
    }

    const getPointerPosition = (event: React.MouseEvent<SVGGElement>): { x: number; y: number } => {
        const container = containerRef.current
        if (!container) return { x: 16, y: 16 }
        const rect = container.getBoundingClientRect()
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        }
    }

    const hoverPanelPosition = useMemo(() => {
        if (!hoverInfo) return { left: 12, top: 12 }
        const panelWidth = 320
        const margin = 12
        const cursorOffset = 34
        const pointerX = hoverInfo.pointer.x
        const pointerY = hoverInfo.pointer.y
        const isRightHalf = pointerX > width / 2
        const left = isRightHalf
            ? Math.max(margin, pointerX - panelWidth - cursorOffset)
            : Math.min(width - panelWidth - margin, pointerX + cursorOffset)
        const top = Math.max(margin, Math.min(height - 24 - margin, pointerY))
        return { left, top }
    }, [hoverInfo, width, height])

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            {treemap && width && height && (
                <svg
                    ref={svgRef}
                    width={width}
                    height={height}
                    style={{ display: 'block', touchAction: 'none', cursor: zoomTransform.k > 1 ? 'grab' : 'default' }}
                >
                    <g transform={zoomTransform.toString()}>
                    {/* Department containers */}
                    {deptNodes.map((dept: any, i: number) => (
                        <g key={i}>
                            <rect
                                x={dept.x0}
                                y={dept.y0}
                                width={dept.x1 - dept.x0}
                                height={dept.y1 - dept.y0}
                                fill="none"
                                stroke="var(--border)"
                                strokeWidth={1}
                            />
                            <rect
                                x={dept.x0}
                                y={dept.y0}
                                width={Math.max(0, dept.x1 - dept.x0)}
                                height={Math.min(22, Math.max(0, dept.y1 - dept.y0))}
                                fill="transparent"
                                pointerEvents="all"
                                onMouseEnter={(event) => {
                                    keepHoverActive()
                                    setHoverInfo({
                                        course: null,
                                        department: dept.data.name,
                                        pointer: getPointerPosition(event),
                                    })
                                }}
                                onMouseMove={(event) => {
                                    const pointer = getPointerPosition(event)
                                    setHoverInfo(prev => {
                                        if (!prev || prev.department !== dept.data.name || prev.course !== null) return prev
                                        const dx = Math.abs(prev.pointer.x - pointer.x)
                                        const dy = Math.abs(prev.pointer.y - pointer.y)
                                        if (dx < 2 && dy < 2) return prev
                                        return { ...prev, pointer }
                                    })
                                }}
                                onMouseLeave={clearHoverSoon}
                                style={{ cursor: 'default' }}
                            />
                            <text
                                x={dept.x0 + 4}
                                y={dept.y0 + 14}
                                fontSize={10}
                                fill="#aaa"
                                style={{ userSelect: 'none', pointerEvents: 'none' }}
                            >
                                {truncateToWidth(
                                    dept.data.name,
                                    Math.max(8, dept.x1 - dept.x0 - 8),
                                    10
                                )}
                            </text>
                        </g>
                    ))}

                    {/* Course rectangles */}
                    {leaves.map((leaf: any, i: number) => {
                        const w = leaf.x1 - leaf.x0
                        const h = leaf.y1 - leaf.y0
                        const course = leaf.data.course as Course
                        const color = getQualityColor(course.avg_quality)
                        const effectiveWidth = w * zoomTransform.k
                        const effectiveHeight = h * zoomTransform.k
                        const labelScreenFontSize = getFittedLabelFontSize(course.class_name, effectiveWidth, effectiveHeight)
                        const showLabel = shouldShowClassLabel(effectiveWidth, effectiveHeight, labelScreenFontSize)
                        const showScore = shouldShowQualityScore(effectiveWidth, effectiveHeight)
                        const scoreScreenFontSize = Math.max(8, Math.min(11, effectiveWidth / 7))
                        const zoomScale = Math.max(1, zoomTransform.k)
                        const labelFontSize = labelScreenFontSize / zoomScale
                        const scoreFontSize = scoreScreenFontSize / zoomScale
                        const labelText = truncateToWidth(
                            course.class_name,
                            Math.max(8, effectiveWidth - 12),
                            labelScreenFontSize
                        )
                        const clipId = `course-clip-${course.class_name.replace(/[^a-zA-Z0-9_-]/g, '-')}-${i}`

                        return (
                            <g
                                key={i}
                                onClick={() => navigate(`/course/${course.class_name}`)}
                                onMouseEnter={(event) => {
                                    keepHoverActive()
                                    const pointer = getPointerPosition(event)
                                    setHoverInfo({
                                        course,
                                        department: leaf.parent?.data?.name ?? course.department,
                                        pointer,
                                    })
                                }}
                                onMouseMove={(event) => {
                                    const pointer = getPointerPosition(event)
                                    setHoverInfo(prev => {
                                        if (!prev || !prev.course || prev.course.class_name !== course.class_name) return prev
                                        const dx = Math.abs(prev.pointer.x - pointer.x)
                                        const dy = Math.abs(prev.pointer.y - pointer.y)
                                        if (dx < 2 && dy < 2) return prev
                                        return { ...prev, pointer }
                                    })
                                }}
                                onMouseLeave={clearHoverSoon}
                                style={{ cursor: 'pointer' }}
                            >
                                <clipPath id={clipId}>
                                    <rect
                                        x={leaf.x0 + 2}
                                        y={leaf.y0 + 2}
                                        width={Math.max(0, w - 4)}
                                        height={Math.max(0, h - 4)}
                                    />
                                </clipPath>
                                <rect
                                    x={leaf.x0}
                                    y={leaf.y0}
                                    width={w}
                                    height={h}
                                    fill={color}
                                    stroke="var(--bg-primary)"
                                    strokeWidth={1}
                                    opacity={0.85}
                                />
                                <title>{course.class_name} — {course.title} — Quality: {course.avg_quality?.toFixed(1) ?? 'N/A'} — Reviews: {course.num_reviews}</title>

                                {showLabel && labelText && (
                                    <text
                                        x={leaf.x0 + w / 2}
                                        y={leaf.y0 + h / 2 - (showScore ? 7 : 0)}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={labelFontSize}
                                        fontWeight={600}
                                        fill="#fff"
                                        clipPath={`url(#${clipId})`}
                                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                                    >
                                        {labelText}
                                    </text>
                                )}
                                {showScore && (
                                    <text
                                        x={leaf.x0 + w / 2}
                                        y={leaf.y0 + h / 2 + 8}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={scoreFontSize}
                                        fill="rgba(255,255,255,0.85)"
                                        clipPath={`url(#${clipId})`}
                                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                                    >
                                        {course.avg_quality?.toFixed(1)}
                                    </text>
                                )}
                            </g>
                        )
                    })}
                    </g>
                </svg>
            )}

            <div
                onMouseEnter={keepHoverActive}
                onMouseLeave={clearHoverSoon}
                style={{
                    position: 'absolute',
                    top: hoverPanelPosition.top,
                    left: hoverPanelPosition.left,
                    width: 320,
                    maxHeight: 'calc(100% - 24px)',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(10, 26, 18, 0.95)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                    overflow: 'hidden',
                    opacity: hoverInfo ? 1 : 0,
                    transform: hoverInfo ? 'translateX(0)' : 'translateX(8px)',
                    transition: 'opacity 140ms ease, transform 140ms ease',
                    pointerEvents: hoverInfo ? 'auto' : 'none',
                }}
            >
                {hoverInfo && (
                    <>
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Department
                            </div>
                            <div style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-md)', fontWeight: 700, marginTop: 2 }}>
                                {hoverInfo.department}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', marginTop: 2 }}>
                                {hoverPanelCourses.length} classes
                            </div>
                        </div>

                        <div style={{ overflowY: 'auto', padding: '8px 0' }}>
                            {hoverPanelCourses.map((course, idx) => {
                                const isHoveredCourse = Boolean(hoverInfo.course) && course.class_name === hoverInfo.course?.class_name
                                return (
                                    <div
                                        key={`${course.class_name}-${idx}`}
                                        style={{
                                            padding: '8px 14px',
                                            borderLeft: isHoveredCourse ? '3px solid #DBCC52' : '3px solid transparent',
                                            background: isHoveredCourse ? 'rgba(219, 204, 82, 0.1)' : 'transparent',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: '#fff',
                                                fontSize: isHoveredCourse ? 'var(--font-size-md)' : 'var(--font-size-sm)',
                                                fontWeight: isHoveredCourse ? 800 : 500,
                                                lineHeight: 1.25,
                                            }}
                                        >
                                            {course.class_name}
                                        </div>
                                        <div
                                            style={{
                                                color: 'var(--text-secondary)',
                                                fontSize: 'var(--font-size-xs)',
                                                marginTop: 2,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {course.title}
                                        </div>
                                        <div
                                            style={{
                                                color: 'var(--text-muted)',
                                                fontSize: 'var(--font-size-xs)',
                                                marginTop: 3,
                                            }}
                                        >
                                            Quality: {course.avg_quality?.toFixed(1) ?? 'N/A'} · Difficulty: {course.avg_difficulty?.toFixed(1) ?? 'N/A'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>

            <div
                style={{
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(10, 26, 18, 0.92)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 8px',
                }}
            >
                <button
                    type="button"
                    onClick={() => {
                        const svgElement = svgRef.current
                        const zoomBehavior = zoomBehaviorRef.current
                        if (!svgElement || !zoomBehavior) return
                        d3.select(svgElement).transition().duration(150).call(zoomBehavior.scaleBy, 1.25)
                    }}
                    style={{
                        background: 'var(--bg-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        width: 24,
                        height: 24,
                        lineHeight: '20px',
                        cursor: 'pointer',
                    }}
                >
                    +
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const svgElement = svgRef.current
                        const zoomBehavior = zoomBehaviorRef.current
                        if (!svgElement || !zoomBehavior) return
                        d3.select(svgElement).transition().duration(150).call(zoomBehavior.scaleBy, 0.8)
                    }}
                    style={{
                        background: 'var(--bg-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        width: 24,
                        height: 24,
                        lineHeight: '20px',
                        cursor: 'pointer',
                    }}
                >
                    -
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const svgElement = svgRef.current
                        const zoomBehavior = zoomBehaviorRef.current
                        if (!svgElement || !zoomBehavior) return
                        d3.select(svgElement).transition().duration(180).call(zoomBehavior.transform, d3.zoomIdentity)
                    }}
                    style={{
                        background: 'var(--bg-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        padding: '0 8px',
                        height: 24,
                        fontSize: 'var(--font-size-xs)',
                        cursor: 'pointer',
                    }}
                >
                    Reset
                </button>
            </div>
        </div>
    )
}
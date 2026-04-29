import { getCollegeColor } from '../utils/collegeColor'

type Props = {
    colleges: string[]
    selected: string
    onSelect: (value: string) => void
}

export default function HeatmapSidebar({ colleges, selected, onSelect }: Props) {
    return (
        <div style={{
            width: '200px',
            flexShrink: 0,
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                    Heatmaps
                </div>
            </div>

            {/* Top 500 option */}
            <div
                onClick={() => onSelect('top500')}
                style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-md)',
                    fontWeight: selected === 'top500' ? 700 : 400,
                    color: selected === 'top500' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: selected === 'top500' ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: selected === 'top500' ? '3px solid #006341' : '3px solid transparent',
                    transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (selected !== 'top500') e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (selected !== 'top500') e.currentTarget.style.background = 'transparent' }}
            >
                Top 500
            </div>

            {/* By College divider */}
            <div style={{
                padding: '8px 16px',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                borderTop: '1px solid var(--border)',
                marginTop: '4px',
            }}>
                By College
            </div>

            {/* College list */}
            {colleges.map(college => (
                <div
                    key={college}
                    onClick={() => onSelect(college)}
                    style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: selected === college ? 700 : 400,
                        color: selected === college ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: selected === college ? 'var(--bg-hover)' : 'transparent',
                        borderLeft: selected === college ? `3px solid ${getCollegeColor(college)}` : '3px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (selected !== college) e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { if (selected !== college) e.currentTarget.style.background = 'transparent' }}
                >
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: getCollegeColor(college), flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', lineHeight: 1.3 }}>{college}</span>
                </div>
            ))}

            {/* Disclaimer */}
            <div style={{
                margin: '12px',
                padding: '10px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginTop: 'auto',
            }}>
                Some colleges may be missing due to lack of reviews. Only courses with {3}+ reviews are shown.
            </div>
        </div>
    )
}
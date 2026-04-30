export default function AboutPage() {
    return (
        <div style={{ padding: 24, background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100%' }}>
            <div style={{ maxWidth: 860, margin: '0 auto', background: 'var(--bg-secondary)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    <p>This website is built to help USask students explore and plan their courses more easily.</p>
                    <p>The data will be updated whenever I feel like it.</p>
                    <p>This was built as a personal side project and is not affiliated with the University of Saskatchewan.</p>
                    <p>Contact: skcourseviz@gmail.com</p>
                </div>
            </div>
        </div>
    )
}

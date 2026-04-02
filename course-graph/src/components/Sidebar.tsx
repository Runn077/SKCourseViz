import { getCollegeColor } from "../utils/collegeColor";

type SidebarProps = {
    colleges: string[];
    enabledColleges: Set<string>;
    onCollegeFilterChange: (enabled: Set<string>) => void;
};

export default function Sidebar({ colleges, enabledColleges, onCollegeFilterChange }: SidebarProps) {
    const toggle = (college: string) => {
        const next = new Set(enabledColleges);
        next.has(college) ? next.delete(college) : next.add(college);
        onCollegeFilterChange(next);
    };

    const toggleAll = (on: boolean) => {
        onCollegeFilterChange(on ? new Set(colleges) : new Set());
    };

    return (
        <div style={{
            width: "240px",
            height: "100%",
            background: "#1a1a2e",
            color: "#f0f0f0",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
        }}>
            {/* Header */}
            <div style={{
                padding: "16px",
                borderBottom: "1px solid #2e2e4d",
            }}>
                <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em" }}>
                    USask Course Graph
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                    {colleges.length} colleges
                </div>
            </div>

            {/* Search placeholder — wired up in next step */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #2e2e4d" }}>
                <input
                    type="text"
                    placeholder="Search courses..."
                    disabled
                    style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "5px",
                        border: "1px solid #3a3a5c",
                        background: "#12122a",
                        color: "#f0f0f0",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        cursor: "not-allowed",
                        opacity: 0.5,
                    }}
                />
            </div>

            {/* College filter */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa" }}>
                        Colleges
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => toggleAll(true)} style={btnStyle}>All</button>
                        <button onClick={() => toggleAll(false)} style={btnStyle}>None</button>
                    </div>
                </div>

                {colleges.map((college) => {
                    const active = enabledColleges.has(college);
                    return (
                        <label key={college} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "5px 4px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            opacity: active ? 1 : 0.4,
                            transition: "opacity 0.15s, background 0.15s",
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a4a")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={() => toggle(college)}
                                style={{ accentColor: getCollegeColor(college), cursor: "pointer" }}
                            />
                            <div style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "2px",
                                flexShrink: 0,
                                background: getCollegeColor(college),
                            }} />
                            <span style={{ fontSize: "12px", lineHeight: 1.3 }}>{college}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    fontSize: "10px",
    padding: "2px 7px",
    cursor: "pointer",
    border: "1px solid #3a3a5c",
    borderRadius: "3px",
    background: "#2a2a4a",
    color: "#ccc",
};
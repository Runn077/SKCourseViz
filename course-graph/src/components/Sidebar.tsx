import { useState, useRef, useEffect } from "react";
import { getCollegeColor } from "../utils/collegeColor";

type CourseNode = { id: string; label: string; college: string };

type SidebarProps = {
    colleges: string[];
    enabledColleges: Set<string>;
    onCollegeFilterChange: (enabled: Set<string>) => void;
    nodes: CourseNode[];
    onNodeFocus: (nodeId: string) => void;
};
export default function Sidebar({ colleges, enabledColleges, onCollegeFilterChange, nodes, onNodeFocus }: SidebarProps) {
    const [query, setQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const toggle = (college: string) => {
        const next = new Set(enabledColleges);
        next.has(college) ? next.delete(college) : next.add(college);
        onCollegeFilterChange(next);
    };

    const toggleAll = (on: boolean) => {
        onCollegeFilterChange(on ? new Set(colleges) : new Set());
    };

    const results = query.trim().length > 0
        ? nodes
            .filter((n) => n.id.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8)
        : [];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = (nodeId: string) => {
        onNodeFocus(nodeId);
        setQuery(nodeId);
        setShowResults(false);
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
            <div style={{ padding: "16px", borderBottom: "1px solid #2e2e4d" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em" }}>
                    USask Course Graph
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                    {nodes.length} courses
                </div>
            </div>

            {/* Search */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #2e2e4d" }} ref={searchRef}>
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "5px",
                        border: "1px solid #3a3a5c",
                        background: "#12122a",
                        color: "#f0f0f0",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        outline: "none",
                    }}
                />
                {showResults && results.length > 0 && (
                    <div style={{
                        background: "#12122a",
                        border: "1px solid #3a3a5c",
                        borderRadius: "5px",
                        marginTop: "4px",
                        overflow: "hidden",
                    }}>
                        {results.map((n) => (
                            <div
                                key={n.id}
                                onMouseDown={() => handleSelect(n.id)}
                                style={{
                                    padding: "7px 10px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    borderBottom: "1px solid #2a2a4a",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "7px",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#2a2a4a")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                                <div style={{
                                    width: "8px", height: "8px",
                                    borderRadius: "50%",
                                    flexShrink: 0,
                                    background: getCollegeColor(n.college),
                                }} />
                                <span style={{ fontWeight: 600 }}>{n.id}</span>
                                <span style={{ color: "#888", fontSize: "11px" }}>{n.college}</span>
                            </div>
                        ))}
                    </div>
                )}
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
                                width: "10px", height: "10px",
                                borderRadius: "2px", flexShrink: 0,
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
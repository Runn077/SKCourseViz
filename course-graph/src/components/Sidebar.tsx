import { useState, useRef, useEffect } from "react";
import { getCollegeColor } from "../utils/collegeColor";
import type { ClusterMode, CourseNode } from "../types";

type SidebarProps = {
    colleges: string[];
    departments: string[];
    subjects: string[];
    enabledColleges: Set<string>;
    enabledDepartments: Set<string>;
    enabledSubjects: Set<string>;
    onCollegeFilterChange: (enabled: Set<string>) => void;
    onDepartmentFilterChange: (enabled: Set<string>) => void;
    onSubjectFilterChange: (enabled: Set<string>) => void;
    nodes: CourseNode[];
    onNodeFocus: (nodeId: string) => void;
    clusterMode: ClusterMode;
    onClusterModeChange: (mode: ClusterMode) => void;
    onGroupFocus: (mode: ClusterMode, value: string) => void;
    departmentToColleges: Map<string, Set<string>>;
    subjectToColleges: Map<string, Set<string>>;
};

export default function Sidebar({
    colleges, departments, subjects,
    enabledColleges, enabledDepartments, enabledSubjects,
    onCollegeFilterChange, onDepartmentFilterChange, onSubjectFilterChange,
    nodes, onNodeFocus,
    clusterMode, onClusterModeChange, onGroupFocus,
    departmentToColleges, subjectToColleges,
}: SidebarProps) {
    const [query, setQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as globalThis.Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const results = query.trim().length > 0
        ? nodes.filter((n) => n.id.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
        : [];

    const handleSelect = (nodeId: string) => {
        onNodeFocus(nodeId);
        setQuery(nodeId);
        setShowResults(false);
    };

    const makeToggle = (enabled: Set<string>, onChange: (s: Set<string>) => void) =>
        (item: string) => {
            const next = new Set(enabled);
            next.has(item) ? next.delete(item) : next.add(item);
            onChange(next);
        };

    const makeToggleAll = (items: string[], onChange: (s: Set<string>) => void) =>
        (on: boolean) => onChange(on ? new Set(items) : new Set());

    const renderFilterList = (
        items: string[],
        enabled: Set<string>,
        onChange: (s: Set<string>) => void,
        mode: ClusterMode,
        colorLookup?: Map<string, Set<string>>
    ) => {
        const toggle = makeToggle(enabled, onChange);
        const toggleAll = makeToggleAll(items, onChange);

        return (
            <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa" }}>
                        {mode === "college" ? "Colleges" : mode === "department" ? "Departments" : "Subjects"}
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => toggleAll(true)} style={btnStyle}>All</button>
                        <button onClick={() => toggleAll(false)} style={btnStyle}>None</button>
                    </div>
                </div>
                {items.map((item) => {
                    const active = enabled.has(item);
                    const colleges = colorLookup
                        ? [...colorLookup.get(item) ?? []]
                        : [item];
                    const colors = colleges.map((c) => getCollegeColor(c));

                    return (
                        <div key={item} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "5px 4px",
                            borderRadius: "4px",
                            opacity: active ? 1 : 0.4,
                            transition: "opacity 0.15s, background 0.15s",
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a4a")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={() => toggle(item)}
                                style={{ accentColor: colors[0], cursor: "pointer", flexShrink: 0 }}
                            />
                            {/* Render one color swatch per college */}
                            <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                                {colors.map((color, i) => (
                                    <div key={i} style={{
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "2px",
                                        background: color,
                                    }} />
                                ))}
                            </div>
                            <span
                                onClick={() => onGroupFocus(mode, item)}
                                style={{ fontSize: "12px", lineHeight: 1.3, cursor: "pointer", flex: 1 }}
                                title={`Zoom to ${item}`}
                            >
                                {item}
                            </span>
                        </div>
                    );
                })}
            </>
        );
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
                                    borderRadius: "50%", flexShrink: 0,
                                    background: getCollegeColor(n.college),
                                }} />
                                <span style={{ fontWeight: 600 }}>{n.id}</span>
                                <span style={{ color: "#888", fontSize: "11px" }}>{n.college}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cluster mode dropdown */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #2e2e4d" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "6px" }}>
                    Cluster By
                </div>
                <select
                    value={clusterMode}
                    onChange={(e) => onClusterModeChange(e.target.value as ClusterMode)}
                    style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "5px",
                        border: "1px solid #3a3a5c",
                        background: "#12122a",
                        color: "#f0f0f0",
                        fontSize: "13px",
                        cursor: "pointer",
                        outline: "none",
                    }}
                >
                    <option value="connectivity">Connectivity</option>
                    <option value="college">College</option>
                    <option value="department">Department</option>
                    <option value="subject">Subject</option>
                </select>
            </div>

            {/* Filter list — changes based on cluster mode */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                {clusterMode === "connectivity" && (
                    <div style={{ fontSize: "12px", color: "#666", textAlign: "center", marginTop: "20px" }}>
                        Select a cluster mode to filter by group.
                    </div>
                )}
                {clusterMode === "college" && renderFilterList(colleges, enabledColleges, onCollegeFilterChange, "college")}
                {clusterMode === "department" && renderFilterList(departments, enabledDepartments, onDepartmentFilterChange, "department", departmentToColleges)}
                {clusterMode === "subject" && renderFilterList(subjects, enabledSubjects, onSubjectFilterChange, "subject", subjectToColleges)}
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
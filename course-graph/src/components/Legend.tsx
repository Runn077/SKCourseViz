import { useState } from "react";
import { getCollegeColor } from "../utils/collegeColor";

type LegendProps = {
    colleges: string[];
    onFilterChange: (enabled: Set<string>) => void;
};

export default function Legend({ colleges, onFilterChange }: LegendProps) {
    const [enabled, setEnabled] = useState<Set<string>>(() => new Set(colleges));

    const toggle = (college: string) => {
        setEnabled((prev) => {
            const next = new Set(prev);
            next.has(college) ? next.delete(college) : next.add(college);
            onFilterChange(next);
            return next;
        });
    };

    const toggleAll = (on: boolean) => {
        const next = on ? new Set(colleges) : new Set<string>();
        setEnabled(next);
        onFilterChange(next);
    };

    return (
        <div style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "white",
            padding: "10px",
            borderRadius: "6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            fontSize: "12px",
            maxHeight: "80vh",
            overflowY: "auto",
            minWidth: "180px"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <strong>Colleges</strong>
                <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => toggleAll(true)}  style={btnStyle}>All</button>
                    <button onClick={() => toggleAll(false)} style={btnStyle}>None</button>
                </div>
            </div>
            {colleges.map((college) => (
                <label key={college} style={{ display: "flex", alignItems: "center", marginTop: "4px", cursor: "pointer", gap: "6px" }}>
                    <input
                        type="checkbox"
                        checked={enabled.has(college)}
                        onChange={() => toggle(college)}
                    />
                    <div style={{
                        width: "12px", height: "12px", flexShrink: 0,
                        background: getCollegeColor(college),
                        opacity: enabled.has(college) ? 1 : 0.3
                    }} />
                    <span style={{ opacity: enabled.has(college) ? 1 : 0.4 }}>{college}</span>
                </label>
            ))}
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    fontSize: "10px", padding: "1px 5px", cursor: "pointer",
    border: "1px solid #ccc", borderRadius: "3px", background: "#f5f5f5"
};
import { getCollegeColor } from "../utils/collegeColor";

type LegendProps = {
    colleges: string[];
};

export default function Legend({ colleges }: LegendProps) {
    return (
        <div style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.95)",
            padding: "10px 14px",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontSize: "12px",
            maxHeight: "80vh",
            overflowY: "auto",
            minWidth: "160px",
            zIndex: 10,
        }}>
            <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#555" }}>
                Legend
            </div>
            {colleges.map((college) => (
                <div key={college} style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "5px" }}>
                    <div style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        flexShrink: 0,
                        background: getCollegeColor(college),
                    }} />
                    <span style={{ color: "#333" }}>{college}</span>
                </div>
            ))}
        </div>
    );
}
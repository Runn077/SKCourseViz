import { getCollegeColor } from "../utils/collegeColor";

type Course = {
    title: string;
    class_name: string;
    description: string;
    college: string;
    department: string;
    subject: string;
    credits: string;
    offered?: string;
    weekly_hours?: string;
    prerequisite: string[];
    link: string;
};

type Props = {
    course: Course;
    onClose: () => void;
};

export default function CourseModal({ course, onClose }: Props) {
    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 100,
                }}
            />

            {/* Modal */}
            <div style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#1a1a2e",
                color: "#f0f0f0",
                borderRadius: "10px",
                padding: "28px",
                width: "520px",
                maxWidth: "90vw",
                maxHeight: "80vh",
                overflowY: "auto",
                zIndex: 101,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "14px",
                        right: "16px",
                        background: "none",
                        border: "none",
                        color: "#aaa",
                        fontSize: "20px",
                        cursor: "pointer",
                        lineHeight: 1,
                    }}
                >
                    ×
                </button>

                {/* College color bar */}
                <div style={{
                    width: "40px",
                    height: "4px",
                    borderRadius: "2px",
                    background: getCollegeColor(course.college),
                    marginBottom: "12px",
                }} />

                {/* Title */}
                <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                    {course.title}
                </div>

                {/* Meta row */}
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#aaa", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span>{course.college}</span>
                    <span>·</span>
                    <span>{course.department}</span>
                    <span>·</span>
                    <span>{course.credits} credits</span>
                    {course.offered && <><span>·</span><span>{course.offered}</span></>}
                </div>

                {/* Description */}
                <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#ddd", marginBottom: "20px" }}>
                    {course.description}
                </div>

                {/* Prerequisites */}
                {course.prerequisite.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "8px" }}>
                            Prerequisites
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {course.prerequisite.map((p) => (
                                <span key={p} style={{
                                    background: "#2a2a4a",
                                    border: "1px solid #3a3a5c",
                                    borderRadius: "4px",
                                    padding: "3px 8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}>
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weekly hours */}
                {course.weekly_hours && (
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "4px" }}>
                            Weekly Hours
                        </div>
                        <div style={{ fontSize: "13px", color: "#ddd" }}>{course.weekly_hours}</div>
                    </div>
                )}

                {/* Link */}
                <a
                    href={course.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        display: "inline-block",
                        marginTop: "4px",
                        padding: "7px 14px",
                        background: getCollegeColor(course.college),
                        color: "#fff",
                        borderRadius: "5px",
                        fontSize: "12px",
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    View on USask Catalogue {'>'}
                </a>
            </div>
        </>
    );
}
import { useEffect, useState, useMemo } from "react";
import GraphComponent from "../components/Graph";
import Sidebar from "../components/Sidebar";
import Legend from "../components/Legend";
import CourseModal from "../components/CourseModal";

function GraphPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [enabledColleges, setEnabledColleges] = useState<Set<string> | null>(null);
    const [focusNode, setFocusNode] = useState<string | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    useEffect(() => {
        fetch("./data/courses.json")
            .then((res) => res.json())
            .then((data) => setCourses(data));
    }, []);

    const allNodes = useMemo(() => courses.map((c) => ({
        id: c.class_name,
        label: c.class_name,
        college: c.college,
    })), [courses]);

    const allEdges = useMemo(() => courses.flatMap((c) =>
        c.prerequisite.map((p: string) => ({
            source: p,
            target: c.class_name,
        }))
    ), [courses]);

    const colleges = useMemo(() =>
        [...new Set(allNodes.map((n) => n.college))].sort()
    , [allNodes]);

    const activeColleges = enabledColleges ?? new Set(colleges);

    const selectedCourse = useMemo(() =>
        courses.find((c) => c.class_name === selectedCourseId) ?? null
    , [courses, selectedCourseId]);

    if (courses.length === 0) return <div>Loading...</div>;

    return (
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
            <Sidebar
                colleges={colleges}
                enabledColleges={activeColleges}
                onCollegeFilterChange={setEnabledColleges}
                nodes={allNodes}
                onNodeFocus={setFocusNode}
            />
            <div style={{ flex: 1, height: "100%", position: "relative" }}>
                <GraphComponent
                    nodes={allNodes}
                    edges={allEdges}
                    enabledColleges={activeColleges}
                    focusNode={focusNode}
                    onNodeDoubleClick={setSelectedCourseId}
                />
                <Legend colleges={colleges} />
            </div>
            {selectedCourse && (
                <CourseModal
                    course={selectedCourse}
                    onClose={() => setSelectedCourseId(null)}
                />
            )}
        </div>
    );
}

export default GraphPage;
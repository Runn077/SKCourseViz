import { useEffect, useState, useMemo } from "react";
import GraphComponent from "../components/Graph";
import Sidebar from "../components/Sidebar";
import Legend from "../components/Legend";
import CourseModal from "../components/CourseModal";
import type { ClusterMode, CourseNode } from "../types/index";

function GraphPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [enabledColleges, setEnabledColleges] = useState<Set<string> | null>(null);
    const [enabledDepartments, setEnabledDepartments] = useState<Set<string> | null>(null);
    const [enabledSubjects, setEnabledSubjects] = useState<Set<string> | null>(null);
    const [focusNode, setFocusNode] = useState<string | null>(null);
    const [focusGroup, setFocusGroup] = useState<{ mode: ClusterMode; value: string } | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [clusterMode, setClusterMode] = useState<ClusterMode>("connectivity");

    useEffect(() => {
        fetch("./data/courses.json")
            .then((res) => res.json())
            .then((data) => setCourses(data));
    }, []);

    const allNodes: CourseNode[] = useMemo(() => courses.map((c) => ({
        id: c.class_name,
        label: c.class_name,
        college: c.college,
        department: c.department,
        subject_code: c.subject_code,
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

    const departments = useMemo(() =>
        [...new Set(allNodes.map((n) => n.department))].sort()
    , [allNodes]);

    const subjects = useMemo(() =>
        [...new Set(allNodes.map((n) => n.subject_code))].sort()
    , [allNodes]);

    const activeColleges = enabledColleges ?? new Set(colleges);
    const activeDepartments = enabledDepartments ?? new Set(departments);
    const activeSubjects = enabledSubjects ?? new Set(subjects);

    // Filter nodes based on active cluster mode filters
    const visibleNodeIds = useMemo(() => {
        return new Set(allNodes
            .filter((n) => {
                if (clusterMode === "college") return activeColleges.has(n.college);
                if (clusterMode === "department") return activeDepartments.has(n.department);
                if (clusterMode === "subject") return activeSubjects.has(n.subject_code);
                return true;
            })
            .map((n) => n.id)
        );
    }, [allNodes, clusterMode, activeColleges, activeDepartments, activeSubjects]);

    const selectedCourse = useMemo(() =>
        courses.find((c) => c.class_name === selectedCourseId) ?? null
    , [courses, selectedCourseId]);

    if (courses.length === 0) return <div>Loading...</div>;

    return (
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
            <Sidebar
                colleges={colleges}
                departments={departments}
                subjects={subjects}
                enabledColleges={activeColleges}
                enabledDepartments={activeDepartments}
                enabledSubjects={activeSubjects}
                onCollegeFilterChange={setEnabledColleges}
                onDepartmentFilterChange={setEnabledDepartments}
                onSubjectFilterChange={setEnabledSubjects}
                nodes={allNodes}
                onNodeFocus={setFocusNode}
                clusterMode={clusterMode}
                onClusterModeChange={setClusterMode}
                onGroupFocus={(mode, value) => setFocusGroup({ mode, value })}
            />
            <div style={{ flex: 1, height: "100%", position: "relative" }}>
                <GraphComponent
                    nodes={allNodes}
                    edges={allEdges}
                    enabledColleges={activeColleges}
                    visibleNodeIds={visibleNodeIds}
                    focusNode={focusNode}
                    focusGroup={focusGroup}
                    clusterMode={clusterMode}
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
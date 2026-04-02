import { useEffect, useState } from "react";
import GraphComponent from "../components/Graph";
import Sidebar from "../components/Sidebar";
import Legend from "../components/Legend";

function GraphPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [enabledColleges, setEnabledColleges] = useState<Set<string> | null>(null);

    useEffect(() => {
        fetch("./data/courses.json")
            .then((res) => res.json())
            .then((data) => setCourses(data));
    }, []);

    const allNodes = courses.map((c) => ({
        id: c.class_name,
        label: c.class_name,
        college: c.college,
    }));

    const allEdges = courses.flatMap((c) =>
        c.prerequisite.map((p: string) => ({
            source: p,
            target: c.class_name,
        }))
    );

    const colleges = [...new Set(allNodes.map((n) => n.college))].sort();
    const activeColleges = enabledColleges ?? new Set(colleges);

    if (courses.length === 0) return <div>Loading...</div>;

    return (
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
            <Sidebar
                colleges={colleges}
                enabledColleges={activeColleges}
                onCollegeFilterChange={setEnabledColleges}
            />
            <div style={{ flex: 1, height: "100%", position: "relative" }}>
                <GraphComponent
                    nodes={allNodes}
                    edges={allEdges}
                    enabledColleges={activeColleges}
                />
                <Legend colleges={colleges} />
            </div>
        </div>
    );
}

export default GraphPage;
import { useEffect, useState } from "react";
import GraphComponent from "../components/Graph";
import Legend from "../components/Legend";

function GraphPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [enabledColleges, setEnabledColleges] = useState<Set<string> | null>(null);

    useEffect(() => {
        fetch("./data/courses.json")
            .then((res) => res.json())
            .then((data) => {
                setCourses(data);
            });
    }, []);

    const allNodes = courses.map((c) => ({
        id: c.class_name,
        label: c.class_name,
        college: c.college
    }));

    const colleges = [...new Set(allNodes.map((n) => n.college))];

    // Default to all enabled on first load
    const activeColleges = enabledColleges ?? new Set(colleges);

    const filteredNodes = allNodes.filter((n) => activeColleges.has(n.college));
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    const allEdges = courses.flatMap((c) =>
        c.prerequisite.map((p: string) => ({
            source: p,
            target: c.class_name,
        }))
    );

    // Only keep edges where BOTH endpoints are visible
    const filteredEdges = allEdges.filter(
        (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );

    if (courses.length === 0) return <div>Loading...</div>;

    // Pass ALL nodes and edges, plus the enabled set
    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <GraphComponent
                nodes={allNodes}
                edges={allEdges}
                enabledColleges={activeColleges}
            />
            <Legend colleges={colleges} onFilterChange={setEnabledColleges} />
        </div>
    );
}

export default GraphPage;
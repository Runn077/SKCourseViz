import { useEffect, useState } from "react";
import GraphComponent from "../components/Graph";

function GraphPage() {
    const [courses, setCourses] = useState<any[]>([]);

    useEffect(() => {
        fetch("./data/courses.json")
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setCourses(data);
            });
    }, []);

    // Convert courses to nodes
    const nodes = courses.map((c) => ({
        id: c.class_name,
        label: c.class_name,
    }));

    // Convert courses to edges (prereqs)
    const edges = courses.flatMap((c) =>
        c.prerequisite.map((p: string) => ({
            source: p,
            target: c.class_name,
        }))
    );

    if (courses.length === 0) return <div>Loading...</div>;
     
    return <GraphComponent nodes={nodes} edges={edges} />;
}

export default GraphPage
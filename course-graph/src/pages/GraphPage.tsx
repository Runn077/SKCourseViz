import { useEffect, useState } from "react";

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

    console.log(nodes);
    console.log(edges);
    return <div>Loaded {courses.length} courses</div>
}

export default GraphPage
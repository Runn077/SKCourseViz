import { useEffect, useRef } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import { getCollegeColor } from "../utils/collegeColor";

type Props = {
    nodes: { id: string; label: string; college: string }[];
    edges: { source: string; target: string }[];
    enabledColleges: Set<string>;
};

function GraphComponent({ nodes, edges, enabledColleges }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<Sigma | null>(null);

    // Build the graph and Sigma instance once
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        const resizeObserver = new ResizeObserver(() => {
            if (container.offsetWidth === 0 || container.offsetHeight === 0) return;
            resizeObserver.disconnect();

            if (rendererRef.current) {
                rendererRef.current.kill();
                rendererRef.current = null;
            }

            const graph = new Graph();

            nodes.forEach((node) => {
                if (!graph.hasNode(node.id)) {
                    graph.addNode(node.id, {
                        x: Math.random(),
                        y: Math.random(),
                        size: 4,
                        label: node.label,
                        college: node.college,
                        color: getCollegeColor(node.college),
                    });
                }
            });

            edges.forEach((edge) => {
                if (
                    graph.hasNode(edge.source) &&
                    graph.hasNode(edge.target) &&
                    !graph.hasEdge(edge.source, edge.target)
                ) {
                    graph.addEdge(edge.source, edge.target, { size: 0.3 });
                }
            });

            rendererRef.current = new Sigma(graph, container, {
                renderEdgeLabels: false,
                labelDensity: 0.05,
                labelGridCellSize: 60,
                labelRenderedSizeThreshold: 15,
                defaultEdgeColor: "#ccc",

                // Filtering happens here — no graph rebuild needed
                nodeReducer: (node, data) => {
                    const college = data.college as string;
                    if (!enabledCollegesRef.current.has(college)) {
                        return { ...data, hidden: true };
                    }
                    return data;
                },
                edgeReducer: (edge, data) => {
                    const graph = rendererRef.current?.getGraph();
                    if (!graph) return data;
                    const source = graph.source(edge);
                    const target = graph.target(edge);
                    const sourceCollege = graph.getNodeAttribute(source, "college");
                    const targetCollege = graph.getNodeAttribute(target, "college");
                    if (
                        !enabledCollegesRef.current.has(sourceCollege) ||
                        !enabledCollegesRef.current.has(targetCollege)
                    ) {
                        return { ...data, hidden: true };
                    }
                    return data;
                },
            });

            const layout = new FA2Layout(graph, {
                settings: { gravity: 1, scalingRatio: 2, slowDown: 10 },
            });
            layout.start();
            setTimeout(() => {
                layout.stop();
                rendererRef.current?.refresh();
            }, 3000);
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (rendererRef.current) {
                rendererRef.current.kill();
                rendererRef.current = null;
            }
        };
    }, [nodes, edges]); // ← only rebuilds if the actual course data changes

    // Sync enabled colleges into a ref so the reducers always see the latest value
    const enabledCollegesRef = useRef<Set<string>>(enabledColleges);
    useEffect(() => {
        enabledCollegesRef.current = enabledColleges;
        rendererRef.current?.refresh(); // just re-renders, no rebuild
    }, [enabledColleges]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default GraphComponent;
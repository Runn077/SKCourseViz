import { useEffect, useRef } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import { getCollegeColor } from "../utils/collegeColor";

type Props = {
    nodes: { id: string; label: string; college: string }[];
    edges: { source: string; target: string }[];
    enabledColleges: Set<string>;
    focusNode: string | null;
};

function GraphComponent({ nodes, edges, enabledColleges, focusNode }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<Sigma | null>(null);
    const enabledCollegesRef = useRef<Set<string>>(enabledColleges);
    const highlightedNodeRef = useRef<string | null>(null);

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

            const sigma = new Sigma(graph, container, {
                renderEdgeLabels: false,
                labelDensity: 0.05,
                labelGridCellSize: 60,
                labelRenderedSizeThreshold: 15,
                defaultEdgeColor: "#ccc",

                nodeReducer: (node, data) => {
                    const college = data.college as string;
                    if (!enabledCollegesRef.current.has(college)) {
                        return { ...data, hidden: true };
                    }
                    const highlighted = highlightedNodeRef.current;
                    if (highlighted === null) return data;
                    if (node === highlighted || graph.neighbors(highlighted).includes(node)) {
                        return { ...data, zIndex: 1 };
                    }
                    return { ...data, color: "#e0e0e0", zIndex: 0 };
                },

                edgeReducer: (edge, data) => {
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
                    const highlighted = highlightedNodeRef.current;
                    if (highlighted === null) return data;
                    if (source === highlighted || target === highlighted) {
                        return { ...data, color: "#555", size: 1.5, zIndex: 1 };
                    }
                    return { ...data, hidden: true };
                },
            });

            sigma.on("clickNode", ({ node }) => {
                highlightedNodeRef.current =
                    highlightedNodeRef.current === node ? null : node;
                sigma.refresh();
            });

            sigma.on("clickStage", () => {
                highlightedNodeRef.current = null;
                sigma.refresh();
            });

            rendererRef.current = sigma;

            const layout = new FA2Layout(graph, {
                settings: {
                    gravity: 1,
                    scalingRatio: 10,
                    slowDown: 10,
                    barnesHutOptimize: true,
                },
            });
            layout.start();
            setTimeout(() => layout.stop(), 8000);
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (rendererRef.current) {
                rendererRef.current.kill();
                rendererRef.current = null;
            }
        };
    }, [nodes, edges]);

    useEffect(() => {
        enabledCollegesRef.current = enabledColleges;
        rendererRef.current?.refresh();
    }, [enabledColleges]);

    // Zoom to node when focusNode changes
    useEffect(() => {
        if (!focusNode || !rendererRef.current) return;
        const sigma = rendererRef.current;
        const graph = sigma.getGraph();

        if (!graph.hasNode(focusNode)) return;

        // Highlight the node
        highlightedNodeRef.current = focusNode;
        sigma.refresh();

        // Animate camera to the node's position
        const nodePosition = sigma.getNodeDisplayData(focusNode);
        if (!nodePosition) return;

        sigma.getCamera().animate(
            { x: nodePosition.x, y: nodePosition.y, ratio: 0.05 },
            { duration: 500 }
        );
    }, [focusNode]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default GraphComponent;
import { useEffect, useRef } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import { getCollegeColor } from "../utils/collegeColor";
import type { ClusterMode, CourseNode } from "../types";

type Props = {
    nodes: CourseNode[];
    edges: { source: string; target: string }[];
    enabledColleges: Set<string>;
    visibleNodeIds: Set<string>;
    focusNode: string | null;
    focusGroup: { mode: ClusterMode; value: string } | null;
    clusterMode: ClusterMode;
    onNodeDoubleClick: (nodeId: string) => void;
};

// Assign initial positions based on cluster group
function getInitialPositions(
    nodes: CourseNode[],
    clusterMode: ClusterMode
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    if (clusterMode === "connectivity") {
        nodes.forEach((n) => {
            positions.set(n.id, { x: Math.random(), y: Math.random() });
        });
        return positions;
    }

    // Get unique groups and assign each a position on a circle
    const getGroup = (n: CourseNode) => {
        if (clusterMode === "college") return n.college;
        if (clusterMode === "department") return n.department;
        return n.subject_code;
    };

    const groups = [...new Set(nodes.map(getGroup))];
    const groupPositions = new Map<string, { x: number; y: number }>();

    groups.forEach((group, i) => {
        const angle = (i / groups.length) * 2 * Math.PI;
        const radius = 10;
        groupPositions.set(group, {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        });
    });

    nodes.forEach((n) => {
        const group = getGroup(n);
        const center = groupPositions.get(group)!;
        positions.set(n.id, {
            x: center.x + (Math.random() - 0.5) * 2,
            y: center.y + (Math.random() - 0.5) * 2,
        });
    });

    return positions;
}

function GraphComponent({
    nodes,
    edges,
    enabledColleges,
    visibleNodeIds,
    focusNode,
    focusGroup,
    clusterMode,
    onNodeDoubleClick,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<Sigma | null>(null);
    const enabledCollegesRef = useRef<Set<string>>(enabledColleges);
    const visibleNodeIdsRef = useRef<Set<string>>(visibleNodeIds);
    const highlightedNodeRef = useRef<string | null>(null);
    const onNodeDoubleClickRef = useRef(onNodeDoubleClick);
    const layoutRef = useRef<FA2Layout | null>(null);

    useEffect(() => {
        onNodeDoubleClickRef.current = onNodeDoubleClick;
    }, [onNodeDoubleClick]);

    // Rebuild graph when nodes, edges, or clusterMode changes
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        const build = () => {
            if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

            // Kill previous layout and renderer
            if (layoutRef.current) {
                layoutRef.current.kill();
                layoutRef.current = null;
            }
            if (rendererRef.current) {
                rendererRef.current.kill();
                rendererRef.current = null;
            }

            highlightedNodeRef.current = null;

            const graph = new Graph();
            const positions = getInitialPositions(nodes, clusterMode);

            nodes.forEach((node) => {
                if (!graph.hasNode(node.id)) {
                    const pos = positions.get(node.id)!;
                    graph.addNode(node.id, {
                        x: pos.x,
                        y: pos.y,
                        size: 4,
                        label: node.label,
                        college: node.college,
                        department: node.department,
                        subject_code: node.subject_code,
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
                    if (!visibleNodeIdsRef.current.has(node)) {
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
                    if (
                        !visibleNodeIdsRef.current.has(source) ||
                        !visibleNodeIdsRef.current.has(target)
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

            let isDoubleClick = false;

            sigma.on("clickNode", ({ node }) => {
                if (isDoubleClick) return;
                highlightedNodeRef.current =
                    highlightedNodeRef.current === node ? null : node;
                sigma.refresh();
            });

            sigma.on("clickStage", () => {
                highlightedNodeRef.current = null;
                sigma.refresh();
            });

            sigma.on("doubleClickNode", ({ node, event }) => {
                event.preventSigmaDefault();
                isDoubleClick = true;
                highlightedNodeRef.current = node;
                sigma.refresh();
                onNodeDoubleClickRef.current(node);
                setTimeout(() => { isDoubleClick = false; }, 300);
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
            layoutRef.current = layout;
            setTimeout(() => {
                layout.stop();
                sigma.refresh();
            }, 8000);
        };

        // If container already has size, build immediately
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
            build();
        } else {
            const resizeObserver = new ResizeObserver(() => {
                if (container.offsetWidth === 0 || container.offsetHeight === 0) return;
                resizeObserver.disconnect();
                build();
            });
            resizeObserver.observe(container);
            return () => resizeObserver.disconnect();
        }

        return () => {
            if (layoutRef.current) {
                layoutRef.current.kill();
                layoutRef.current = null;
            }
            if (rendererRef.current) {
                rendererRef.current.kill();
                rendererRef.current = null;
            }
        };
    }, [nodes, edges, clusterMode]);

    // Sync visible nodes without rebuilding
    useEffect(() => {
        visibleNodeIdsRef.current = visibleNodeIds;
        rendererRef.current?.refresh();
    }, [visibleNodeIds]);

    // Sync enabled colleges without rebuilding
    useEffect(() => {
        enabledCollegesRef.current = enabledColleges;
        rendererRef.current?.refresh();
    }, [enabledColleges]);

    // Zoom to a specific node
    useEffect(() => {
        if (!focusNode || !rendererRef.current) return;
        const sigma = rendererRef.current;
        const graph = sigma.getGraph();
        if (!graph.hasNode(focusNode)) return;
        highlightedNodeRef.current = focusNode;
        sigma.refresh();
        const nodePosition = sigma.getNodeDisplayData(focusNode);
        if (!nodePosition) return;
        sigma.getCamera().animate(
            { x: nodePosition.x, y: nodePosition.y, ratio: 0.05 },
            { duration: 500 }
        );
    }, [focusNode]);

    // Zoom to a group cluster center
    useEffect(() => {
        if (!focusGroup || !rendererRef.current) return;
        const sigma = rendererRef.current;
        const graph = sigma.getGraph();

        const { mode, value } = focusGroup;

        const getGroup = (nodeId: string) => {
            if (mode === "college") return graph.getNodeAttribute(nodeId, "college");
            if (mode === "department") return graph.getNodeAttribute(nodeId, "department");
            return graph.getNodeAttribute(nodeId, "subject_code");
        };

        // Find all nodes in this group and average their display positions
        const groupNodes = graph.nodes().filter((n) => getGroup(n) === value);
        if (groupNodes.length === 0) return;

        let sumX = 0, sumY = 0, count = 0;
        groupNodes.forEach((n) => {
            const pos = sigma.getNodeDisplayData(n);
            if (pos) { sumX += pos.x; sumY += pos.y; count++; }
        });

        if (count === 0) return;

        sigma.getCamera().animate(
            { x: sumX / count, y: sumY / count, ratio: 0.2 },
            { duration: 600 }
        );
    }, [focusGroup]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default GraphComponent;
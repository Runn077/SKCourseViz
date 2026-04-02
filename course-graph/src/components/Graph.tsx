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

    const getGroup = (n: CourseNode) => {
        if (clusterMode === "college") return n.college;
        if (clusterMode === "department") return n.department;
        return n.subject_code;
    };

    // Group nodes
    const groups = new Map<string, CourseNode[]>();
    nodes.forEach((n) => {
        const group = getGroup(n);
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group)!.push(n);
    });

    const groupList = [...groups.keys()];
    const totalGroups = groupList.length;

    // Calculate the radius each group needs based on its node count
    const groupRadii = new Map<string, number>();
    groups.forEach((groupNodes, group) => {
        // Radius needed to fit all nodes in a spiral without overlap
        groupRadii.set(group, Math.sqrt(groupNodes.length) * 1.2 + 2); 
    });

    // Place groups on a circle large enough so no two groups overlap
    // The minimum distance between two group centers = sum of their radii + padding
    const maxGroupRadius = Math.max(...groupRadii.values());
    
    // Use a large enough outer radius so adjacent groups don't touch
    // circumference must fit totalGroups * (2 * maxGroupRadius + padding)
    const padding = 8;
    const minCircumference = totalGroups * (2 * maxGroupRadius + padding);
    const outerRadius = minCircumference / (2 * Math.PI);

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    groupList.forEach((group, i) => {
        const groupNodes = groups.get(group)!;
        const angle = (i / totalGroups) * 2 * Math.PI;

        const cx = Math.cos(angle) * outerRadius;
        const cy = Math.sin(angle) * outerRadius;

        const nodeSpread = groupRadii.get(group)!;

        groupNodes.forEach((n, j) => {
            const r = nodeSpread * Math.sqrt(j / Math.max(groupNodes.length - 1, 1));
            const theta = j * goldenAngle;
            positions.set(n.id, {
                x: cx + r * Math.cos(theta),
                y: cy + r * Math.sin(theta),
            });
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

            if (clusterMode === "connectivity") {
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
            } else {
                // Store edges temporarily
                const storedEdges: { source: string; target: string; attributes: any }[] = [];
                graph.forEachEdge((edge, attributes, source, target) => {
                    storedEdges.push({ source, target, attributes });
                });

                // Remove all edges so ForceAtlas2 only uses gravity, no edge pulling
                graph.clearEdges();

                const layout = new FA2Layout(graph, {
                    settings: {
                        gravity: 10,
                        scalingRatio: 2,
                        slowDown: 5,
                        barnesHutOptimize: true,
                        adjustSizes: true,
                    },
                });
                layout.start();
                layoutRef.current = layout;

                setTimeout(() => {
                    layout.stop();

                    // Restore edges after layout settles
                    storedEdges.forEach(({ source, target, attributes }) => {
                        if (graph.hasNode(source) && graph.hasNode(target) && !graph.hasEdge(source, target)) {
                            graph.addEdge(source, target, attributes);
                        }
                    });

                    sigma.refresh();
                }, 2000);
            }
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

        // Use graph coordinates directly
        const x = graph.getNodeAttribute(focusNode, "x");
        const y = graph.getNodeAttribute(focusNode, "y");

        const { x: vx, y: vy } = sigma.graphToViewport({ x, y });
        const framedPos = sigma.viewportToFramedGraph({ x: vx, y: vy });

        sigma.getCamera().animate(
            { x: framedPos.x, y: framedPos.y, ratio: 0.05 },
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

        // Use graph coordinates (x, y attributes) not display coordinates
        const groupNodes = graph.nodes().filter((n) => getGroup(n) === value);
        if (groupNodes.length === 0) return;

        let sumX = 0, sumY = 0, count = 0;
        groupNodes.forEach((n) => {
            sumX += graph.getNodeAttribute(n, "x");
            sumY += graph.getNodeAttribute(n, "y");
            count++;
        });

        if (count === 0) return;

        // Convert graph coordinates to viewport coordinates
        const { x, y } = sigma.graphToViewport({ x: sumX / count, y: sumY / count });
        const viewportCenter = sigma.viewportToFramedGraph({ x, y });

        // Calculate zoom ratio based on group size
        const groupSize = groupNodes.length;
        const ratio = Math.max(0.05, Math.min(0.5, groupSize / (nodes.length * 0.8)));

        sigma.getCamera().animate(
            { x: viewportCenter.x, y: viewportCenter.y, ratio },
            { duration: 600 }
        );
    }, [focusGroup]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default GraphComponent;
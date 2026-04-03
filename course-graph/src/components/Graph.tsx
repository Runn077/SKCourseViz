import { useEffect, useRef } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import { getCollegeColor } from "../utils/collegeColor";
import type { ClusterMode, CourseNode } from "../types/index";

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

function getTargetPositions(
    nodes: CourseNode[],
    clusterMode: ClusterMode
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    if (clusterMode === "connectivity") {
        nodes.forEach((n) => {
            positions.set(n.id, {
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10,
            });
        });
        return positions;
    }

    const getGroup = (n: CourseNode) => {
        if (clusterMode === "college") return n.college;
        if (clusterMode === "department") return n.department;
        return n.subject_code;
    };

    const groups = new Map<string, CourseNode[]>();
    nodes.forEach((n) => {
        const group = getGroup(n);
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group)!.push(n);
    });

    const groupList = [...groups.keys()];
    const totalGroups = groupList.length;

    const groupRadii = new Map<string, number>();
    groups.forEach((groupNodes, group) => {
        groupRadii.set(group, Math.sqrt(groupNodes.length) * 1.2 + 2);
    });

    const maxGroupRadius = Math.max(...groupRadii.values());
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

function animatePositions(
    graph: Graph,
    targetPositions: Map<string, { x: number; y: number }>,
    sigma: Sigma,
    duration: number,
    onComplete: () => void
) {
    const startPositions = new Map<string, { x: number; y: number }>();
    graph.forEachNode((node) => {
        startPositions.set(node, {
            x: graph.getNodeAttribute(node, "x"),
            y: graph.getNodeAttribute(node, "y"),
        });
    });

    const startTime = performance.now();

    const frame = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        graph.forEachNode((node) => {
            const start = startPositions.get(node);
            const target = targetPositions.get(node);
            if (!start || !target) return;
            graph.setNodeAttribute(node, "x", start.x + (target.x - start.x) * eased);
            graph.setNodeAttribute(node, "y", start.y + (target.y - start.y) * eased);
        });

        sigma.refresh();

        if (t < 1) {
            requestAnimationFrame(frame);
        } else {
            onComplete();
        }
    };

    requestAnimationFrame(frame);
}

function GraphComponent({
    nodes, edges, enabledColleges, visibleNodeIds,
    focusNode, focusGroup, clusterMode, onNodeDoubleClick,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<Sigma | null>(null);
    const graphRef = useRef<Graph | null>(null);
    const enabledCollegesRef = useRef<Set<string>>(enabledColleges);
    const visibleNodeIdsRef = useRef<Set<string>>(visibleNodeIds);
    const highlightedNodeRef = useRef<string | null>(null);
    const onNodeDoubleClickRef = useRef(onNodeDoubleClick);
    const layoutRef = useRef<FA2Layout | null>(null);
    const clusterModeRef = useRef<ClusterMode>(clusterMode);

    useEffect(() => {
        onNodeDoubleClickRef.current = onNodeDoubleClick;
    }, [onNodeDoubleClick]);

    // Build Sigma once
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        const build = () => {
            if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

            if (layoutRef.current) { layoutRef.current.kill(); layoutRef.current = null; }
            if (rendererRef.current) { rendererRef.current.kill(); rendererRef.current = null; }

            highlightedNodeRef.current = null;

            const graph = new Graph();
            graphRef.current = graph;

            const positions = getTargetPositions(nodes, clusterModeRef.current);

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
                maxCameraRatio: 2,

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

            // Camera bounds enforcement with guard to prevent recursive updates
            let isClamping = false;
            sigma.getCamera().on("updated", (state) => {
                if (isClamping) return;
                const bounds = sigma.getBBox();
                if (!bounds) return;

                // Convert graph bbox corners to framed graph coordinates
                const topLeft = sigma.viewportToFramedGraph(
                    sigma.graphToViewport({ x: bounds.x[0], y: bounds.y[0] })
                );
                const bottomRight = sigma.viewportToFramedGraph(
                    sigma.graphToViewport({ x: bounds.x[1], y: bounds.y[1] })
                );

                const padding = 0.3;
                const minX = Math.min(topLeft.x, bottomRight.x) - padding;
                const maxX = Math.max(topLeft.x, bottomRight.x) + padding;
                const minY = Math.min(topLeft.y, bottomRight.y) - padding;
                const maxY = Math.max(topLeft.y, bottomRight.y) + padding;

                let { x, y, ratio } = state;
                let clamped = false;

                if (x < minX) { x = minX; clamped = true; }
                if (x > maxX) { x = maxX; clamped = true; }
                if (y < minY) { y = minY; clamped = true; }
                if (y > maxY) { y = maxY; clamped = true; }

                if (clamped) {
                    isClamping = true;
                    sigma.getCamera().setState({ x, y, ratio });
                    isClamping = false;
                }
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

            startLayout(graph, sigma, clusterModeRef.current);
        };

        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
            build();
        } else {
            const ro = new ResizeObserver(() => {
                if (container.offsetWidth === 0 || container.offsetHeight === 0) return;
                ro.disconnect();
                build();
            });
            ro.observe(container);
            return () => ro.disconnect();
        }

        return () => {
            if (layoutRef.current) { layoutRef.current.kill(); layoutRef.current = null; }
            if (rendererRef.current) { rendererRef.current.kill(); rendererRef.current = null; }
        };
    }, [nodes, edges]);

    // Handle cluster mode changes with animation — no Sigma rebuild
    useEffect(() => {
        clusterModeRef.current = clusterMode;
        const sigma = rendererRef.current;
        const graph = graphRef.current;
        if (!sigma || !graph) return;

        if (layoutRef.current) { layoutRef.current.kill(); layoutRef.current = null; }

        const targetPositions = getTargetPositions(nodes, clusterMode);

        animatePositions(graph, targetPositions, sigma, 1000, () => {
            startLayout(graph, sigma, clusterMode);
        });
    }, [clusterMode]);

    function startLayout(graph: Graph, sigma: Sigma, mode: ClusterMode) {
        if (mode === "connectivity") {
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
            setTimeout(() => { layout.stop(); sigma.refresh(); }, 8000);
        } else {
            // Store edges BEFORE clearing
            const storedEdges: { source: string; target: string; attributes: any }[] = [];
            graph.forEachEdge((edge, attributes, source, target) => {
                storedEdges.push({ source, target, attributes });
            });
            graph.clearEdges(); // clear AFTER storing

            const layout = new FA2Layout(graph, {
                settings: {
                    gravity: 10,
                    scalingRatio: 2,
                    slowDown: 5,
                    barnesHutOptimize: true,
                },
            });
            layout.start();
            layoutRef.current = layout;

            setTimeout(() => {
                layout.stop();
                storedEdges.forEach(({ source, target, attributes }) => {
                    if (graph.hasNode(source) && graph.hasNode(target) && !graph.hasEdge(source, target)) {
                        graph.addEdge(source, target, attributes);
                    }
                });
                sigma.refresh();
            }, 2000);
        }
    }

    useEffect(() => {
        visibleNodeIdsRef.current = visibleNodeIds;
        rendererRef.current?.refresh();
    }, [visibleNodeIds]);

    useEffect(() => {
        enabledCollegesRef.current = enabledColleges;
        rendererRef.current?.refresh();
    }, [enabledColleges]);

    useEffect(() => {
        if (!focusNode || !rendererRef.current || !graphRef.current) return;
        const sigma = rendererRef.current;
        const graph = graphRef.current;
        if (!graph.hasNode(focusNode)) return;
        highlightedNodeRef.current = focusNode;
        sigma.refresh();
        const x = graph.getNodeAttribute(focusNode, "x");
        const y = graph.getNodeAttribute(focusNode, "y");
        const { x: vx, y: vy } = sigma.graphToViewport({ x, y });
        const framedPos = sigma.viewportToFramedGraph({ x: vx, y: vy });
        sigma.getCamera().animate(
            { x: framedPos.x, y: framedPos.y, ratio: 0.05 },
            { duration: 500 }
        );
    }, [focusNode]);

    useEffect(() => {
        if (!focusGroup || !rendererRef.current || !graphRef.current) return;
        const sigma = rendererRef.current;
        const graph = graphRef.current;
        const { mode, value } = focusGroup;

        const getGroup = (nodeId: string) => {
            if (mode === "college") return graph.getNodeAttribute(nodeId, "college");
            if (mode === "department") return graph.getNodeAttribute(nodeId, "department");
            return graph.getNodeAttribute(nodeId, "subject_code");
        };

        const groupNodes = graph.nodes().filter((n) => getGroup(n) === value);
        if (groupNodes.length === 0) return;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        groupNodes.forEach((n) => {
            const x = graph.getNodeAttribute(n, "x");
            const y = graph.getNodeAttribute(n, "y");
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const { x: vx, y: vy } = sigma.graphToViewport({ x: centerX, y: centerY });
        const framedPos = sigma.viewportToFramedGraph({ x: vx, y: vy });

        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;

        const graphBounds = sigma.getBBox();
        const totalGraphWidth = graphBounds.x[1] - graphBounds.x[0];
        const totalGraphHeight = graphBounds.y[1] - graphBounds.y[0];

        const widthFraction = (graphWidth + 10) / totalGraphWidth;
        const heightFraction = (graphHeight + 10) / totalGraphHeight;

        const fraction = Math.max(widthFraction, heightFraction);
        const clampedRatio = Math.max(0.02, Math.min(1.5, fraction * 1.4));

        sigma.getCamera().animate(
            { x: framedPos.x, y: framedPos.y, ratio: clampedRatio },
            { duration: 600 }
        );
    }, [focusGroup]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default GraphComponent;
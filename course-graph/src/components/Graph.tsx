import { useEffect, useRef } from "react"
import Sigma from "sigma";
import Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";

type Props = {
    nodes: any[];
    edges: any[];
};

function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const toHex = (x: number) =>
        Math.round(x * 255).toString(16).padStart(2, "0");

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function getCollegeColor(college?: string): string {
    if (!college) return "#999999";

    let hash = 0;
    for (let i = 0; i < college.length; i++) {
        hash = college.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash % 360);
    return hslToHex(hue, 80, 50); // ← hex instead of hsl()
}

function GraphComponent({ nodes, edges }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    // store renderer so we can destroy old one
    const rendererRef = useRef<Sigma | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        const resizeObserver = new ResizeObserver(() => {
            const width = container.offsetWidth;
            const height = container.offsetHeight;

            if (width === 0 || height === 0) return;

            resizeObserver.disconnect();

            // Kill previous renderer if it exists
            if (rendererRef.current) {
                rendererRef.current.kill();
                rendererRef.current = null;
            }

            const graph = new Graph();

            // Add nodes
            nodes.forEach((node) => {
                if (!graph.hasNode(node.id)) {
                    graph.addNode(node.id, {
                        x: Math.random(),
                        y: Math.random(),
                        size: 4,
                        color: getCollegeColor(node.college)
                    });
                }
            });

            // Add edges
            edges.forEach((edge) => {
                if (
                    graph.hasNode(edge.source) &&
                    graph.hasNode(edge.target) &&
                    !graph.hasEdge(edge.source, edge.target)
                ) {
                    graph.addEdge(edge.source, edge.target, {
                        size: 0.3
                    });
                }
            });

            // create renderer and store it
            rendererRef.current = new Sigma(graph, container, {
                renderEdgeLabels: false,
                labelDensity: 0.05,
                labelGridCellSize: 60,
                labelRenderedSizeThreshold: 15,

                defaultNodeColor: "#999",
                defaultEdgeColor: "#ccc"
            });

            // Run layout in background worker
            const layout = new FA2Layout(graph, {
                settings: {
                    gravity: 1,
                    scalingRatio: 2,
                    slowDown: 10,
                },
            });

            layout.start();

            // Stop after 3 seconds
            setTimeout(() => {
                layout.stop();
                rendererRef.current?.refresh(); // ← important
            }, 3000);
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();

            // cleanup on unmount
            if (rendererRef.current) {
                rendererRef.current.kill();
                rendererRef.current = null;
            }
        };

    }, [nodes, edges]);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%"
            }}
        />
    );
}

export default GraphComponent;
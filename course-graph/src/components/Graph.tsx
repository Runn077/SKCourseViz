import { useEffect, useRef } from "react"
import Sigma from "sigma";
import Graph from "graphology";

type Props = {
    nodes: any[];
    edges: any[];
};

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
                        size: 2
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
            });
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
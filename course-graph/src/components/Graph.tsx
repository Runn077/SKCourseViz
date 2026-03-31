import { useEffect, useRef } from "react"
import Sigma from "sigma";
import Graph from "graphology";

type Props = {
    nodes: any[];
    edges: any[];
};

function GraphComponent({ nodes, edges }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const graph = new Graph();

        nodes.forEach((node) => {
            if (!graph.hasNode(node.id)) {
                graph.addNode(node.id, {
                    label: node.label,
                    x: Math.random(),
                    y: Math.random(),
                    size: 5,
                });
            }
        });

        edges.forEach((edge) => {
            if (
                graph.hasNode(edge.source) &&
                graph.hasNode(edge.target) &&
                !graph.hasEdge(edge.source, edge.target)
            ) {
                graph.addEdge(edge.source, edge.target);
            }
        });
        const renderer = new Sigma(graph, containerRef.current!);

        return () => {
            renderer.kill();
        };
    }, [nodes, edges]);

    return <div ref={containerRef} style={{ height: "100vh" }} />;
}

export default GraphComponent;
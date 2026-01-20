"use client";

import React, { useRef, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { ComplianceReport } from "@/types/policy";
import { transformReportToGraph } from "@/lib/graphUtils";

// Import ForceGraph3D dynamically to avoid SSR issues with Window
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

interface ComplianceGraphProps {
    report: ComplianceReport;
}

const ComplianceGraph: React.FC<ComplianceGraphProps> = ({ report }) => {
    const fgRef = useRef<any>();

    const graphData = useMemo(() => transformReportToGraph(report), [report]);

    useEffect(() => {
        // Auto-orbit camera
        let angle = 0;
        const interval = setInterval(() => {
            if (fgRef.current) {
                angle += 0.003;
                fgRef.current.cameraPosition({
                    x: 200 * Math.sin(angle),
                    z: 200 * Math.cos(angle)
                });
            }
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-[500px] w-full border rounded-lg overflow-hidden relative bg-black">
            <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded text-white text-xs border border-white/10 backdrop-blur-sm">
                <h3 className="font-bold text-lg mb-1">System Topology</h3>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Policy</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-500 rounded-full"></span> Component</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-600 rotate-45 transform"></span> Risk / Violation</div>
                </div>
            </div>

            <ForceGraph3D
                ref={fgRef as any}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={(node: any) => {
                    if (node.group === "risk") return "#ef4444"; // Red
                    if (node.group === "policy") return "#3b82f6"; // Blue
                    return "#a855f7"; // Purple
                }}
                nodeVal={(node: any) => node.val}
                linkColor={() => "rgba(255,255,255,0.2)"}
                linkWidth={1}
                backgroundColor="#000000"
                enableNodeDrag={false}
                onNodeClick={(node: any) => {
                    // Fly to node on click
                    const distance = 40;
                    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                    fgRef.current.cameraPosition(
                        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
                        node, // lookAt ({ x, y, z })
                        3000  // ms transition duration
                    );
                }}
                nodeThreeObjectExtend={true} // Use default sphere but extend? Actually just simple spheres for now
            />
        </div>
    );
};

export default ComplianceGraph;

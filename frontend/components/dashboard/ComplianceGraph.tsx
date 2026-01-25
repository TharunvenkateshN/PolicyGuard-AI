"use client";

import React, { useRef, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { ComplianceReport } from "@/types/policy";
import { transformReportToGraph } from "@/lib/graphUtils";

// Import ForceGraph3D dynamically
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

interface ComplianceGraphProps {
    report: ComplianceReport;
}

const ComplianceGraph: React.FC<ComplianceGraphProps> = ({ report }) => {
    const fgRef = useRef<any>();
    const graphData = useMemo(() => transformReportToGraph(report), [report]);

    useEffect(() => {
        if (fgRef.current) {
            // Force Setup for 3D Spacing
            const linkForce = fgRef.current.d3Force('link');
            if (linkForce) linkForce.distance(150).strength(0.5);

            fgRef.current.d3Force('charge').strength(-500);

            // Warm up engine
            fgRef.current.numDimensions(3);
        }
    }, [graphData]);

    return (
        <div className="h-[700px] w-full border border-slate-800 rounded-3xl overflow-hidden relative bg-[#020617] group shadow-2xl">
            {/* Legend / Overlay - HUD Style */}
            <div className="absolute top-6 left-6 z-10 bg-slate-950/60 p-4 rounded-2xl text-white text-xs border border-cyan-500/20 backdrop-blur-xl shadow-2xl">
                <h3 className="font-bold text-xl mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono tracking-tighter uppercase italic">
                    Neural Topology (3D)
                </h3>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <span className="font-medium text-slate-300">Policy (Constraint)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                        <span className="font-medium text-slate-300">Component (Asset)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-red-500 rotate-45 transform shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <span className="font-medium text-slate-300">Risk / Violation</span>
                    </div>
                </div>
            </div>

            {/* AI HUD Controls */}
            <div className="absolute bottom-6 left-6 z-10 text-[10px] text-cyan-500/50 pointer-events-none bg-slate-950/40 px-3 py-1.5 rounded-full border border-cyan-500/10 backdrop-blur-sm uppercase tracking-[0.2em] font-mono">
                L: Rotate | R: Pan | Wheel: Zoom | Drag Nodes: Position
            </div>

            <div className="absolute bottom-6 right-6 z-50 flex gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (fgRef.current) {
                            fgRef.current.zoomToFit(800, 100);
                        }
                    }}
                    className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-cyan-500/20 backdrop-blur-sm transition-all shadow-lg active:scale-95"
                >
                    Recenter Matrix
                </button>
            </div>

            <ForceGraph3D
                ref={fgRef as any}
                graphData={graphData}
                backgroundColor="#020617"

                // Advanced Node Object Factory
                nodeThreeObject={(node: any) => {
                    let geometry;
                    let color;
                    let size = node.val ? node.val : 5;

                    if (node.group === "risk") {
                        // Diamond/Octahedron for risks
                        geometry = new THREE.OctahedronGeometry(size * 1.5);
                        color = "#ef4444";
                    } else if (node.group === "policy") {
                        // Cube for policies
                        geometry = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
                        color = "#3b82f6";
                    } else {
                        // Sphere for components
                        geometry = new THREE.SphereGeometry(size * 1.2, 24, 24);
                        color = "#06b6d4";
                    }

                    const material = new THREE.MeshPhongMaterial({
                        color,
                        transparent: true,
                        opacity: 0.9,
                        shininess: 100,
                        specular: new THREE.Color(color).multiplyScalar(1.5)
                    });

                    const mesh = new THREE.Mesh(geometry, material);

                    // Add wireframe overlay for tech look
                    const wireframe = new THREE.WireframeGeometry(geometry);
                    const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 });
                    const line = new THREE.LineSegments(wireframe, lineMaterial);
                    mesh.add(line);

                    return mesh;
                }}

                // Labels in 3D using canvas texture or Sprite?
                // Sprite is easier for billboard effect
                nodeThreeObjectExtend={true}

                // Interaction
                onNodeDragEnd={(node: any) => {
                    node.fx = node.x;
                    node.fy = node.y;
                    node.fz = node.z;
                }}

                // Link Visuals - Tron Lines
                linkColor={() => "rgba(6, 182, 212, 0.3)"}
                linkWidth={0.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => "#06b6d4"}

                // Scene Lighting
                enableNodeDrag={true}
                showNavInfo={false}
            />
        </div>
    );
};

export default ComplianceGraph;

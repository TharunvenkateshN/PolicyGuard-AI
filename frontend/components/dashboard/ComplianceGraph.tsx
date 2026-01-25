"use client";

import React, { useRef, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { ComplianceReport } from "@/types/policy";
import { transformReportToGraph } from "@/lib/graphUtils";

// Import ForceGraph3D dynamically
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

import { Zap } from "lucide-react";
import SpriteText from "three-spritetext";

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

            // Auto-recenter on load
            setTimeout(() => {
                if (fgRef.current) {
                    fgRef.current.zoomToFit(800, 100);
                    fgRef.current.numDimensions(3);
                }
            }, 1000);
        }
    }, [graphData]);

    const handleRecenter = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (fgRef.current) {
            fgRef.current.zoomToFit(600, 100);
        }
    };

    return (
        <div id="compliance-graph-container" className="h-[700px] w-full border border-slate-800 rounded-3xl overflow-hidden relative bg-[#01060e] group shadow-2xl">
            {/* Legend / Overlay - Box Style from Mockup */}
            <div className="absolute top-8 left-8 z-10 bg-[#020817]/80 backdrop-blur-md p-5 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] min-w-[200px]">
                <h3 className="font-black text-lg mb-4 text-cyan-400 font-mono tracking-tighter uppercase italic border-b border-cyan-500/10 pb-2">
                    System Topology
                </h3>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-blue-600 rounded-md ring-1 ring-blue-400/50 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                        <span className="font-semibold text-xs text-slate-300 tracking-wide">Policy (Constraint)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-cyan-500 rounded-full ring-1 ring-cyan-300/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]"></div>
                        <span className="font-semibold text-xs text-slate-300 tracking-wide">Component (Asset)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-red-600 rotate-45 transform ring-1 ring-red-400/50 shadow-[0_0_10px_rgba(220,38,38,0.4)]"></div>
                        <span className="font-semibold text-xs text-slate-300 tracking-wide">Risk / Violation</span>
                    </div>
                </div>
            </div>

            {/* AI HUD Controls - Bottom Left Box */}
            <div className="absolute bottom-10 left-8 z-10 px-4 py-2 bg-[#020817]/60 rounded-lg border border-cyan-500/20 backdrop-blur-sm">
                <div className="text-[10px] text-cyan-500/60 font-mono flex gap-4 uppercase tracking-widest whitespace-nowrap lg:flex-row flex-col">
                    <span>L: Rotate</span>
                    <span className="hidden lg:inline opacity-30">|</span>
                    <span>R: Pan</span>
                    <span className="hidden lg:inline opacity-30">|</span>
                    <span>Wheel: Zoom</span>
                    <span className="hidden lg:inline opacity-30">|</span>
                    <span>Drag Nodes: Position</span>
                </div>
            </div>

            {/* Recenter Button - Bottom Right Box */}
            <div className="absolute bottom-10 right-8 z-50">
                <button
                    onClick={handleRecenter}
                    className="group flex items-center gap-2 px-6 py-2.5 bg-[#020817]/80 hover:bg-cyan-900/40 text-cyan-400 text-[11px] font-black uppercase tracking-[0.15em] rounded-full border border-cyan-500/40 hover:border-cyan-400 backdrop-blur-md transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 active:scale-95 whitespace-nowrap"
                >
                    <Zap className="w-3 h-3 text-cyan-500 group-hover:animate-pulse" />
                    Recenter Matrix
                </button>
            </div>

            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                backgroundColor="#01060e"
                controlType="orbit"
                showNavInfo={false}
                enableNodeDrag={true}

                // Interaction & Recenter support
                cooldownTicks={100}
                onEngineStop={() => {
                    // Optional: recenter once when layout settles if not already handled
                }}
                nodeLabel={(node: any) => {
                    if (!node) return "";
                    return `
                        <div class="bg-slate-900/90 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md shadow-2xl">
                            <div class="font-bold text-cyan-400 text-sm mb-1 uppercase tracking-wider">${node.name}</div>
                            <div class="text-slate-300 text-xs leading-relaxed max-w-[200px]">${node.desc || 'No additional data available.'}</div>
                            <div class="mt-2 text-[10px] text-slate-500 italic">Group: ${node.group}</div>
                        </div>
                    `;
                }}

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

                    const group = new THREE.Group();
                    const mesh = new THREE.Mesh(geometry, material);

                    // Add wireframe overlay for tech look
                    const wireframe = new THREE.WireframeGeometry(geometry);
                    const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 });
                    const line = new THREE.LineSegments(wireframe, lineMaterial);
                    mesh.add(line);
                    group.add(mesh);

                    // Add Title (SpriteText)
                    if (node.name) {
                        const sprite = new SpriteText(node.name);
                        sprite.color = color;
                        sprite.textHeight = size * 0.8;
                        sprite.position.y = size * 2.5; // Positioning above node
                        sprite.fontFace = 'Inter, system-ui, sans-serif';
                        sprite.fontWeight = 'bold';
                        group.add(sprite);
                    }

                    return group;
                }}

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

            // Scene Lighting & Stability
            />
        </div>
    );
};

export default ComplianceGraph;

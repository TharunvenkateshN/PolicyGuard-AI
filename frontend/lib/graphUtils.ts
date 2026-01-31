import { ComplianceReport } from "@/types/policy";

interface GraphNode {
    id: string;
    name: string;
    group: "policy" | "risk" | "component";
    val: number; // Size
    desc?: string;
}

interface GraphLink {
    source: string;
    target: string;
    type: "violates" | "governs" | "contains";
}

export const transformReportToGraph = (report: ComplianceReport) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set<string>();

    const addNode = (id: string, name: string, group: GraphNode["group"], val: number, desc?: string) => {
        if (!nodeIds.has(id)) {
            nodes.push({ id, name, group, val, desc });
            nodeIds.add(id);
        }
    };

    // 1. System Spec (Central Hub)
    const specName = report.system_spec.agent_name || "AI System";
    addNode(specName, specName, "component", 20, report.system_spec.summary);

    // 2. Data Categories
    report.data_map.data_categories_detected.forEach(cat => {
        addNode(cat, cat, "component", 10, "Data Category");
        links.push({ source: specName, target: cat, type: "contains" });
    });

    // 3. Policies
    report.policy_matrix.forEach((policy) => {
        // Policy Node
        const policyId = policy.policy_area;

        // Show all policies, size based on importance
        addNode(policyId, policy.policy_area, "policy", 15, policy.reason);
        // Link policy to central spec
        links.push({ source: specName, target: policyId, type: "governs" });
    });

    // 4. Risks (Evidence) - Processed separately to ensure they always appear
    report.evidence.forEach((ev, idx) => {
        const riskId = `Risk-${idx}`;
        const severityLabel = ev.severity ? `${ev.severity} Risk` : "Risk";

        // Add Risk Node
        addNode(riskId, severityLabel, "risk", 12, ev.issue_description);

        // Try to find a matching policy to link to
        // We use a looser matching strategy here
        const matchingPolicy = report.policy_matrix.find(p =>
            ev.policy_section.toLowerCase().includes(p.policy_area.toLowerCase()) ||
            p.policy_area.toLowerCase().includes(ev.policy_section.toLowerCase())
        );

        if (matchingPolicy) {
            links.push({ source: matchingPolicy.policy_area, target: riskId, type: "violates" });
        } else {
            // Fallback: Link to central spec if no specific policy parent found
            links.push({ source: specName, target: riskId, type: "violates" });
        }
    });

    return { nodes, links };
};

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

    // 3. Policies & Risks
    report.policy_matrix.forEach((policy) => {
        // Policy Node
        const policyId = policy.policy_area;
        const isCompliant = policy.status === "Compliant";

        // Show all policies, size based on importance
        addNode(policyId, policy.policy_area, "policy", 15, policy.reason);
        links.push({ source: specName, target: policyId, type: "governs" });

        // If risk/non-compliant, associate Risks
        if (!isCompliant) {
            // Find evidence that matches this policy
            const relevantEvidence = report.evidence.filter(e => e.policy_section.includes(policy.policy_area) || policy.reason.includes(e.issue_description.substring(0, 10)));

            relevantEvidence.forEach((ev, idx) => {
                const riskId = `Risk-${policyId}-${idx}`;
                addNode(riskId, ev.severity + " Risk", "risk", 12, ev.issue_description);
                links.push({ source: policyId, target: riskId, type: "violates" });
            });
        }
    });

    return { nodes, links };
};

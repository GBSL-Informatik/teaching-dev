export interface GraphNode {
    id: string;
    parentId: string | null;
}

export interface GraphRow<N extends GraphNode> {
    node: N;
    /** the lane (column) of the node's dot */
    lane: number;
    /** lanes coming from above which end in this node's dot */
    incomingLanes: number[];
    /** lanes passing this row without touching the node */
    passingLanes: number[];
    /** whether the node's lane continues downwards to its parent */
    hasParent: boolean;
}

export interface CommitGraph<N extends GraphNode> {
    rows: GraphRow<N>[];
    laneCount: number;
}

/**
 * Assigns each node to a lane, similar to `git log --graph`.
 * The nodes must be ordered newest first, so that children come before their parents.
 */
export const layoutCommitGraph = <N extends GraphNode>(nodes: N[]): CommitGraph<N> => {
    // each lane holds the id of the node it leads to, `null` for a free lane
    const lanes: (string | null)[] = [];
    let laneCount = 0;

    const rows = nodes.map((node) => {
        const incomingLanes = lanesLeadingTo(lanes, node.id);
        const passingLanes = activeLanes(lanes).filter((lane) => !incomingLanes.includes(lane));
        const lane = incomingLanes[0] ?? firstFreeLane(lanes);

        incomingLanes.forEach((incoming) => {
            lanes[incoming] = null;
        });
        lanes[lane] = node.parentId;
        laneCount = Math.max(laneCount, lanes.length);
        trimFreeLanesAtEnd(lanes);

        return { node, lane, incomingLanes, passingLanes, hasParent: !!node.parentId };
    });

    return { rows, laneCount };
};

const lanesLeadingTo = (lanes: (string | null)[], id: string) => {
    return lanes.flatMap((leadsTo, lane) => (leadsTo === id ? [lane] : []));
};

const activeLanes = (lanes: (string | null)[]) => {
    return lanes.flatMap((leadsTo, lane) => (leadsTo !== null ? [lane] : []));
};

const firstFreeLane = (lanes: (string | null)[]) => {
    const freeLane = lanes.indexOf(null);
    return freeLane < 0 ? lanes.length : freeLane;
};

const trimFreeLanesAtEnd = (lanes: (string | null)[]) => {
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) {
        lanes.pop();
    }
};

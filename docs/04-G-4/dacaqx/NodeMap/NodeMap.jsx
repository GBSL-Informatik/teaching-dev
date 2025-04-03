
import React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from "reactflow";

import "reactflow/dist/style.css";
import { useUnlockEdgesHandler, useUnlockHandler } from "./useUnlockHandler";

import styles from "./styles.module.css";

const CustomNode = ({ data }) => {
  return (
    <div className={styles.node}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div>{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

//aStarGraph = parse local storage
const startGraph = [
  {
      id: "S",
      type: "custom",
      position: { x: 300, y: 50 },
      data: { label: "S", image: require('../../images/S.jpeg').default },
  },
{
  id: "A",
  type: "custom",
  position: { x: 150, y: 150 },
  data: { label: "37 A", image: require('../../images/A.jpeg').default },
},
{
  id: "B",
  type: "custom",
  position: { x: 450, y: 150 },
  data: { label: "39 B", image: require('../../images/B.jpeg').default },
}]
const A_STAR_GRAPH = [
  ...startGraph,
  {
    id: "C",
    type: "custom",
    position: { x: 250, y: 250 },
    data: { label: "20 C", image: require('../../images/C.jpeg').default },
  },
  {
    id: "D",
    type: "custom",
    position: { x: 400, y: 250 },
    data: { label: "28 D", image: require('../../images/D.jpeg').default },
  },
  {
    id: "E",
    type: "custom",
    position: { x: 100, y: 350 },
    data: { label: "15 E", image: require('../../images/E.jpeg').default },
  },
  {
    id: "F",
    type: "custom",
    position: { x: 250, y: 330 },
    data: { label: "0 F", image: require('../../images/F.jpeg').default },
  },
  {
    id: "G",
    type: "custom",
    position: { x: 500, y: 350 },
    data: { label: "26 G", image: require('../../images/G.jpeg').default },
  },
  {
    id: "H",
    type: "custom",
    position: { x: 250, y: 450 },
    data: { label: "11 H", image: require('../../images/H.jpeg').default },
  },
];

//edges = parseLocalStorage

const initialEdges = [
  {
    id: "eS-A",
    source: "S",
    target: "A",
    label: "14",
    className: styles.edgeLabel,
  },
  {
    id: "eS-B",
    source: "S",
    target: "B",
    label: "24",
    className: styles.edgeLabel,
  },
  {
    id: "eA-C",
    source: "A",
    target: "C",
    label: "45",
    className: styles.edgeLabel,
  },
  {
    id: "eB-D",
    source: "B",
    target: "D",
    label: "50",
    className: styles.edgeLabel,
  },
  {
    id: "eA-E",
    source: "A",
    target: "E",
    label: "33",
    className: styles.edgeLabel,
  },
  {
    id: "eC-E",
    source: "C",
    target: "E",
    label: "5",
    className: styles.edgeLabel,
  },
  {
    id: "eC-D",
    source: "C",
    target: "D",
    label: "10",
    className: styles.edgeLabel,
  },
  {
    id: "eD-G",
    source: "D",
    target: "G",
    label: "27",
    className: styles.edgeLabel,
  },
  {
    id: "eG-H",
    source: "G",
    target: "H",
    label: "68",
    className: styles.edgeLabel,
  },
  {
    id: "eF-H",
    source: "F",
    target: "H",
    label: "11",
    className: styles.edgeLabel,
  },
  {
    id: "eD-H",
    source: "D",
    target: "H",
    label: "13",
    className: styles.edgeLabel,
  },
  {
    id: "eE-H",
    source: "E",
    target: "H",
    label: "37",
    className: styles.edgeLabel,
  },
  {
    id: "eB-G",
    source: "B",
    target: "G",
    label: "22",
    className: styles.edgeLabel,
  },
];

const NodeGraph = ({newNodes, newEdges, initializeNew}) => {
  const [selectedNode, setSelectedNode] = React.useState(null);
  const aStarNodes = useUnlockHandler(newNodes ?? [], initializeNew);
  const aStarEdges = useUnlockEdgesHandler(newEdges ?? [], initializeNew);

  const aStarGraph = React.useMemo(() => {
    return A_STAR_GRAPH.filter((n) => aStarNodes.includes(n.id))
  }, [aStarNodes])

  const edges = React.useMemo(() => {
    return initialEdges.filter((e) => aStarEdges.includes(e.id));
  }, [aStarEdges]);

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const closePopup = () => {
    setSelectedNode(null);
  };

  return (
    <div className={styles.container}>
      <ReactFlow
        nodes={aStarGraph}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false} // Disable moving nodes
        elementsSelectable={false}
        onNodeClick={onNodeClick}
      >
        <Controls />
        <Background />
      </ReactFlow>
      {selectedNode && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h2>{selectedNode.data.label}</h2>
            <p>{selectedNode.data.description}</p>
            <img src={selectedNode.data.image} alt={selectedNode.data.label} className={styles.popupImage} />
            <button onClick={closePopup} className={styles.closeButton}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeGraph;

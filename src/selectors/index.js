import { createSelector } from 'reselect';
import { addNode, infer } from 'bayesjs';

import { NETWORK_KINDS } from '../actions';

export const getNetwork = state => state.network;
export const getNodes = state => state.network.nodes || state.nodes || [];
export const getPositions = state => state.network.positions || state.positions || [];
export const getBeliefs = state => state.network.beliefs;
export const getSubnetworks = state => state.network.subnetworks || [];
export const getNetworkKind = state => state.network.kind || NETWORK_KINDS.BN;
export const getPanelVisibility = state => state.network.propertiesPanelVisible;

export const getStateToSave = createSelector(
  getNetwork,
  getNodes,
  getPositions,
  (network, nodes, positions) => ({
    version: 2,
    network: {
      ...network,
      selectedNodes: [],
      beliefs: {},
    },
    nodes,
    positions,
  })
);

export const getSelectedNode = createSelector(
  getNetwork,
  getNodes,
  (network, nodes) => {
    if (network.selectedNodes.length !== 1) {
      return null;
    }

    return nodes.find(x => x.id === network.selectedNodes[0]);
  },
);

export const getSelectedSubnetwork = createSelector(
  getNetwork,
  getSubnetworks,
  (network, subnetworks) => {
    if (network.selectedNodes.length !== 1) {
      return null;
    }

    return subnetworks.find(sub => sub.id === network.selectedNodes[0]);
  },
);

export const getNodesWithPositions = createSelector(
  getNodes,
  getPositions,
  (nodes, positions) => nodes.map(node => ({
    ...node,
    position: positions[node.id],
  })),
);

export const getSubnetworksWithPosition = createSelector(
  getSubnetworks,
  getPositions,
  (subnetworks, positions) => subnetworks.map(subnetwork => ({
    ...subnetwork,
    position: positions[subnetwork.id || subnetwork.name],
  })),
);

export const getInferenceResults = createSelector(
  getNodes,
  getBeliefs,
  (nodes, beliefs) => {
    let network = {};

    const remainingNodes = [...nodes];

    while (remainingNodes.length > 0) {
      const nodesToAdd = [];

      for (let i = 0; i < remainingNodes.length; i++) {
        if (remainingNodes[i].parents.every(p => network.hasOwnProperty(p))) {
          nodesToAdd.push(remainingNodes.splice(i, 1)[0]);
        }
      }

      nodesToAdd.forEach(nodeToAdd => {
        network = addNode(network, nodeToAdd);
      });
    }

    const results = {};

    nodes.forEach(node => {
      results[node.id] = {};

      node.states.forEach(state => {
        results[node.id][state] = infer(
          network,
          { [node.id]: state },
          Object.keys(beliefs).length === 0 ? undefined : beliefs,
        );
      });
    });

    return results;
  }
);

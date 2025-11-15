window.addEventListener('DOMContentLoaded', () => {
  if (typeof vis === 'undefined') {
    alert('vis-network not loaded. Add the vis script tag to your HTML.');
    return;
  }

  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();
  let nextId = 0;
  let edgeMode = false;
  let pending = [];

  const container = document.getElementById('network');
  if (!container) { alert('#network container missing'); return; }

  const net = new vis.Network(container, { nodes, edges }, {
    physics: false,
    interaction: { multiselect: true },
    edges: { smooth: true },
    nodes: { shape: 'dot', size: 18, font: { size: 16 } }
  });

  // Controls
  const $ = id => document.getElementById(id);
  const addNodeBtn = $('addNode'), edgeBtn = $('edgeMode'),
        removeBtn = $('removeNode'), runBtn = $('run'),
        stepBtn = $('step'), clearBtn = $('clear');

  function addNode() {
    const rect = container.getBoundingClientRect();
    const x = Math.max(40, Math.min(rect.width - 40, 100 + (nextId * 40) % (rect.width - 120)));
    const y = Math.max(40, Math.min(rect.height - 40, 100 + Math.floor(nextId / 10) * 40));
    nodes.add({ id: nextId, label: String(nextId), x, y, color: '#114c99ff' });
    nextId++;
  }
  addNodeBtn?.addEventListener('click', addNode);

  edgeBtn?.addEventListener('click', () => {
    edgeMode = !edgeMode;
    edgeBtn.textContent = edgeMode ? 'Edge Mode: ON' : 'Add Edge';
    pending = [];
  });

  removeBtn?.addEventListener('click', () => {
    const sel = net.getSelectedNodes();
    if (!sel || sel.length === 0) { alert('Select a node to remove'); return; }
    nodes.remove(sel);
  });

  clearBtn?.addEventListener('click', () => {
    nodes.clear(); edges.clear(); nextId = 0; pending = [];
  });

  net.on('selectNode', params => {
    if (!edgeMode) return;
    const id = params.nodes && params.nodes[0];
    if (id == null) return;
    pending.push(id);
    if (pending.length === 2) {
      const [a, b] = pending;
      if (a !== b) {
        const exists = edges.get().some(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
        if (!exists) edges.add({ from: a, to: b });
      }
      pending = [];
    }
  });

  // adjacency builder
  function buildAdj() {
    const maxId = Math.max(0, nextId);
    const adj = Array.from({ length: maxId }, () => []);
    edges.forEach(e => {
      if (e.from < adj.length && e.to < adj.length) {
        adj[e.from].push(e.to);
        adj[e.to].push(e.from);
      }
    });
    return adj;
  }

  // Tarjan's algorithm to find articulation points (returns array of ids)
  function findAPs(adj) {
    const n = adj.length;
    const tin = Array(n).fill(-1), low = Array(n).fill(-1), visited = Array(n).fill(false);
    const isAP = Array(n).fill(false);
    let timer = 0;

    function dfs(v, p) {
      visited[v] = true;
      tin[v] = low[v] = timer++;
      let children = 0;
      for (const to of adj[v]) {
        if (to === p) continue;
        if (!visited[to]) {
          children++;
          dfs(to, v);
          low[v] = Math.min(low[v], low[to]);
          if (p !== -1 && low[to] >= tin[v]) isAP[v] = true;
        } else {
          low[v] = Math.min(low[v], tin[to]);
        }
      }
      if (p === -1 && children > 1) isAP[v] = true;
    }

    for (let i = 0; i < n; i++) if (!visited[i]) dfs(i, -1);
    return isAP.map((flag, i) => flag ? i : null).filter(x => x !== null);
  }

  function resetNodeColors() {
    nodes.forEach(node => nodes.update({ id: node.id, color: '#97C2FC' }));
  }

  runBtn?.addEventListener('click', () => {
    try {
      const adj = buildAdj();
      resetNodeColors();
      const aps = findAPs(adj);
      aps.forEach(id => nodes.update({ id, color: '#ff6b6b' }));
      document.getElementById('result').textContent =
        aps.length ? `Articulation points: ${aps.join(', ')}` : 'No articulation points';

    } catch (e) {
      console.error(e); alert('Error computing articulation points');
    }
  });

  // Step animation: simple visit-highlights in DFS order
  stepBtn?.addEventListener('click', async () => {
    try {
      const adj = buildAdj();
      const n = adj.length;
      const tin = Array(n).fill(-1), low = Array(n).fill(-1), vis = Array(n).fill(false);
      let t = 0;
      const order = [];

      function dfs(v, p) {
        vis[v] = true; tin[v] = low[v] = t++;
        order.push({ type: 'visit', v, tin: tin[v] });
        for (const to of adj[v]) {
          if (to === p) continue;
          if (!vis[to]) {
            dfs(to, v);
            low[v] = Math.min(low[v], low[to]);
            order.push({ type: 'back', v, to, lowV: low[v] });
          } else {
            low[v] = Math.min(low[v], tin[to]);
            order.push({ type: 'backEdge', v, to });
          }
        }
      }
      for (let i = 0; i < n; i++) if (!vis[i]) dfs(i, -1);

      resetNodeColors();
      for (const step of order) {
        if (step.type === 'visit') nodes.update({ id: step.v, color: '#ffd966' });
        else if (step.type === 'back') nodes.update({ id: step.to, color: '#a9d18e' });
        else if (step.type === 'backEdge') nodes.update({ id: step.to, color: '#a9d18e' });
        
        await new Promise(r => setTimeout(r, 1000));
      }
      // finally mark articulation points
      const aps = findAPs(adj);
      aps.forEach(id => nodes.update({ id, color: '#ff6b6b' }));
    } catch (e) {
      console.error(e); alert('Step animation failed');
    }
  });

});

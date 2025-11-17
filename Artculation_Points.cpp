#include <bits/stdc++.h>
using namespace std;

int MODE = 0; 

void wait_step() {
    if (MODE == 1) {
        cout << "  (press ENTER)\n";
        cout.flush();
        string tmp;
        std::getline(cin, tmp);
    }
}

void dfs_sim(int u, int parent,
             const vector<vector<int>>& g,
             vector<int>& tin, vector<int>& low,
             vector<char>& vis, vector<char>& is_art,
             vector<pair<int,int>>& bridges, int &timer)
{
    vis[u] = 1;
    tin[u] = low[u] = timer++;
    cout << ">> Enter " << u << " (parent=" << parent << ")\n";
    cout.flush();
    wait_step();

    int children = 0;
    for (int v : g[u]) {
        if (v == parent) continue;

        if (vis[v]) {
            // back edge
            low[u] = min(low[u], tin[v]);
            cout << "   back-edge " << u << "-" << v << " -> low[" << u << "]=" << low[u] << "\n";
            cout.flush();
            wait_step();
        } else {
            cout << "   tree-edge " << u << "-" << v << " -> go\n";
            cout.flush();
            wait_step();
            ++children;
            dfs_sim(v, u, g, tin, low, vis, is_art, bridges, timer);
            low[u] = min(low[u], low[v]);

            if (low[v] > tin[u]) {
                cout << "   BRIDGE: " << u << " - " << v << "\n";
                bridges.emplace_back(min(u,v), max(u,v));
            }
            if (parent != -1 && low[v] >= tin[u]) {
                cout << "   ARTICULATION: " << u << "\n";
                is_art[u] = 1;
            }
            cout.flush();
            wait_step();
        }
    }

    if (parent == -1 && children > 1) {
        cout << "   ROOT ARTICULATION: " << u << "\n";
        is_art[u] = 1;
        cout.flush();
        wait_step();
    }

    cout << "<< Exit " << u << "\n";
    cout.flush();
    wait_step();
}

int main() {

    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> g(n);
    vector<pair<int,int>> edges;
    edges.reserve(m);
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        edges.emplace_back(u, v);
    }
    for (auto &e : edges) {
        int u = e.first, v = e.second;
        if (u >= 0 && u < n && v >= 0 && v < n) {
            g[u].push_back(v);
            g[v].push_back(u);
        }
    }

    cout << "Mode? 0 = normal, 1 = step : ";
    cin >> MODE;
    cin.ignore(numeric_limits<streamsize>::max(), '\n'); 

    cout << "\nStarting simulation...\n";

    vector<int> tin(n, -1), low(n, -1);
    vector<char> vis(n, 0), is_art(n, 0);
    vector<pair<int,int>> bridges;
    int timer = 0;

    for (int i = 0; i < n; ++i) {
        if (!vis[i]) {
            cout << "\n--- DFS at " << i << " ---\n";
            cout.flush();
            wait_step();
            dfs_sim(i, -1, g, tin, low, vis, is_art, bridges, timer);
        }
    }

    sort(bridges.begin(), bridges.end());
    cout << "\n===== FINAL =====\n";
    cout << "Articulation points: ";
    bool any = false;
    for (int i = 0; i < n; ++i) if (is_art[i]) { if (any) cout << ' '; cout << i; any = true; }
    if (!any) cout << "None";
    cout << "\nBridges:\n";
    if (bridges.empty()) cout << "None\n";
    else for (auto &e : bridges) cout << e.first << ' ' << e.second << '\n';

    return 0;
}

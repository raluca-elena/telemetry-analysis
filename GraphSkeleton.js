/**
 * graphSkeleton.js functionality:
 *
 * exports graph structure
 */
exports.graphSkeleton = {
    "version":                "0.2.0",
    "params":                 {
        "test-worker-type":     "test-worker"
    },
    "routing":                "",
    "tasks": [],
    "metadata": {
        "name":         "AF TaskGraph",
        "description":  "Task-graph description in markdown",
        "owner":        "root@localhost.local",
        "source":       "http://github.com/taskcluster/task-graph-scheduler"
    },
    "tags": {
        "MyTestTag": "AF blue version"
    }
};

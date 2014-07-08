var task = {
    "label":              "customLabel",
    "requires":           [],
    "reruns":             0,
    "task": {
        "version":          "0.2.0",
        "provisionerId":    "aws-provisioner",
        "workerType":       "raluca",
        "routing":          "",
        "timeout":          600,
        "retries":          3,
        "priority":         5,
        "created": new Date().toISOString(),
        "deadline": new Date(+new Date + 12096e5).toISOString(),
        "payload": {
            "image":          'registry.taskcluster.net/vagrant',
            "command": [
                'node', '/opt/analysis-tools/downloader.js',
            ],
            "features": {
                "azureLivelog": true
            },
            artifacts: {
                // Name:              Source:
                'passwd.txt':         '/etc/passwd',
                'result': '/home/worker/result.txt'
            },
            "maxRunTime":     600
        },
        "metadata": {
            "name":           "Exec mapper `'Blue Sky'` ",
            "description":    "This task will take files as input and run a mapper function on them",
            "owner":          "ralucaelena1985@gmail.com",
            "source":         "https://github.com/taskcluster/task-graph-scheduler"
        },
        "tags": {
            "objective":      "Analysis Framework"
        }
    }
};

exports.fabricateIndependentTask = function (label, image) {
    task['label'] = label;
    if (image)
        task['task']['payload']['image'] = image;
    return JSON.parse(JSON.stringify(task));
}
exports.fabricateDependentTask = function (label, dependencies, command) {
    task['label'] = label;
    task['requires'] = dependencies;
    if (command)
        task['task']['payload']['command'] = command;

    return JSON.parse(JSON.stringify(task));

}

//get image and...
//create credentials
//insert credentials as env var to image
//insert credentials to image

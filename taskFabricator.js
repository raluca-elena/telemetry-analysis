/**
 * taskFabricator.js functionality:
 *
 * step1: given the task skeleton plugs attributes and returns new task object
 */
var task = {
    "label":              "customLabel",
    "requires":           [],
    "reruns":             0,
    "task": {
        "version":          "0.2.0",
        "provisionerId":    "aws-provisioner",
        "workerType":       "test-r3-xlarge",
        "routing":          "",
        "timeout":          1200,
        "retries":          3,
        "priority":         5,
        "created": new Date().toISOString(),
        "deadline": new Date(+new Date + 12096e5).toISOString(),
        "payload": {
            "image":          'registry.taskcluster.net/aaa',
            "command": [
                'node', '/opt/analysis-tools/mapper.js',
            ],
            env: {

            },
            "features": {
                "azureLivelog": true
            },
            artifacts: {
                // Name:              Source:
                'passwd.txt':         '/etc/passwd',
                'result': '/home/worker/result.txt'
            },
            "maxRunTime":     2400
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

//concatenate all taskIds as one env var for the reducer task
function getMapperTasksIdsAsEnv(labels) {
    var str = "";
    for (var i = 0; i < labels.length -1; i++)
        str = str.concat("{{taskId:"+labels[i]+"}} ");
    str = str.concat("{{taskId:"+labels[labels.length-1]+"}}");
    return str;
}

//mapper task
exports.fabricateIndependentTask = function (label, image, load, env, credentials) {
    var newTask = JSON.parse(JSON.stringify(task));
    newTask['label'] = label;
    if (image) {
        newTask['task']['payload']['image'] = image;
    }
    if (load) {
        newTask['task']['payload']['command'] = newTask['task']['payload']['command'].concat(load);
    }
    if (env) {
        var cloneEnv = JSON.parse(JSON.stringify(env));
        newTask['task']['payload']['env'] = cloneEnv;
    }
    if (credentials) {
        newTask['task']['payload']['env']['CREDENTIALS'] = credentials;
    }
    return newTask;
}

//reducer task
exports.fabricateDependentTask = function (label, dependencies, command, env, credentials) {
    var dep = getMapperTasksIdsAsEnv(dependencies);
    var newTask = JSON.parse(JSON.stringify(task));
    newTask['label'] = label;
    newTask['requires'] = dependencies;
    if (command) {
        newTask['task']['payload']['command'] = command;
    }
    if (env) {
        var cloneEnv = JSON.parse(JSON.stringify(env));
        newTask['task']['payload']['env'] = cloneEnv;
        newTask['task']['payload']['env']['REDUCER_ID'] = "{{taskId:reducer}}";
        newTask['task']['payload']['env']['INPUT_TASK_IDS'] = dep;
    }
    if (credentials) {
        newTask['task']['payload']['env']['CREDENTIALS'] = credentials;
    }
    return newTask;
}

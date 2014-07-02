var request         = require('superagent');
// Task graph that'll post in this test
var taskGraphExample = {
  "version":                "0.2.0",
  "params":                 {
    "test-worker-type":     "test-worker"
  },
  "routing":                "",
  "tasks": {
    "print-once": {
      "requires":           [],
      "reruns":             0,
      "task": {
        "version":          "0.2.0",
        "provisionerId":    "aws-provisioner",
        "workerType":       "{{test-worker-type}}",
        "routing":          "",
        "timeout":          600,
        "retries":          3,
        "priority":         5,
        "created":          "2014-03-01T22:19:32.124Z",
        "deadline":         "2060-03-01T22:19:32.124Z",
        "payload": {
          "image":          "ubuntu:latest",
          "command": [
            "/bin/bash", "-c",
            "echo 'Hello World'"
          ],
          "features": {
            "azureLivelog": true
          },
          "maxRunTime":     600
        },
        "metadata": {
          "name":           "Print `'Hello World'` Once",
          "description":    "This task will prìnt `'Hello World'` **once**!",
          "owner":          "jojensen@mozilla.com",
          "source":         "https://github.com/taskcluster/task-graph-scheduler"
        },
        "tags": {
          "objective":      "Test task-graph scheduler"
        }
      }
    },
    "print-twice": {
      "requires":           ["print-once"],
      "reruns":             0,
      "task": {
        "version":          "0.2.0",
        "provisionerId":    "aws-provisioner",
        "workerType":       "{{test-worker-type}}",
        "routing":          "",
        "timeout":          600,
        "retries":          3,
        "priority":         5,
        "created":          "2014-03-01T22:19:32.124Z",
        "deadline":         "2060-03-01T22:19:32.124Z",
        "payload": {
          "image":          "ubuntu:latest",
          "command": [
            "/bin/bash", "-c",
            "echo 'Hello World (Again)'"
          ],
          "features": {
            "azureLivelog": true
          },
          "maxRunTime":     600
        },
        "metadata": {
          "name":           "Print `'Hello World'` Again",
          "description":    "This task will prìnt `'Hello World'` **again**! " +
                            "and wait for {{taskId:print-once}}.",
          "owner":          "jojensen@mozilla.com",
          "source":         "https://github.com/taskcluster/task-graph-scheduler"
        },
        "tags": {
          "objective":      "Test task-graph scheduler"
        }
      }
    }
  },
  "metadata": {
    "name":         "Validation Test TaskGraph",
    "description":  "Task-graph description in markdown",
    "owner":        "root@localhost.local",
    "source":       "http://github.com/taskcluster/task-graph-scheduler"
  },
  "tags": {
    "MyTestTag": "Hello World"
  }
};

request
  .post('http://scheduler.taskcluster.net/v1/task-graph/create')
        .send(taskGraphExample)
        .end(function(res){
        if (res.ok) {
            console.log(JSON.stringify(res.body));
        } else {
            console.log('Oh no! error ' + res.text);
        }
  });

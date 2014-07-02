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
            image:    'registry.taskcluster.net/raluca/telemetry-mr-base',     // docker image identifier
            command:  [             // Command followed by arguments to execute
                'node', '/bin/mapper/downloader.js',
                "saved_session/Fennec/nightly/22.0a1/20130227030925.20131101.v2.log.cc03cd521ba84613808daf1e0d6d3ab6.lzma",
                "saved_session/Fennec/nightly/22.0a1/20130329030904.20140310.v2.log.8ecdaa95df95421a8f50f7571d2c8954.lzma",

            ],
            env: { KEY: 'value' },  // Environment variables for the container
            features: {             // Set of optional features
                bufferLog:    false,  // Debug log everything to result.json blob
                azureLiveLog: true,   // Live log everything to azure, see logs.json
                artifactLog:  false   // Log every to an artifact uploaded at end of run
            },
            artifacts: {
                // Name:              Source:
                'passwd.txt':         '/etc/passwd',
                'result': '/bin/mapper/result.txt'
            },
            maxRunTime:             600 // Maximum allowed run time
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

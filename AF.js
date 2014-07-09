#!/usr/bin/env node
var request = require('superagent');
var myFakeServ = "http://localhost:8080/files";
var taskClusterCreateGraphUrl = 'http://scheduler.taskcluster.net/v1/task-graph/create';
var gskeleton = require('./GraphSkeleton');
var fs = require('fs');

graphSkeleton = gskeleton.graphSkeleton;
taskModule =  require('./taskFabricator');

var argv = process.argv;

//drop node and name of script, should be replaced with some commander.js call
argv.shift();
argv.shift();
var file = argv[0];
var image = argv[1];
var envVar = argv[2] ? JSON.parse(argv[2]) : {};

//give me env variables
var data = fs.readFileSync(file, 'utf8')
data = JSON.parse(data);
var filter = {"filter": data};
var result;
function getMapperTasksIdsAsEnv(labels) {
    var str = "";
    for (var i = 0; i < labels.length -1; i++)
        str = str.concat("{{taskId:"+labels[i]+"}} ");
    str = str.concat("{{taskId:"+labels[labels.length-1]+"}}");
    return {"INPUT_TASK_IDS": str};
}

function parseIndexDBResponse(response) {
    var files = [];
    var size = [];
    var totalSize = 0;
    for (var i = 0; i < response.length; i++) {
        for (var key in response[i]) {
            if (key == 'file_name') {
                files.push(response[i][key]);
            } else {
                size.push(response[i][key]);
                totalSize += response[i][key];
            }
        }
    }
    var response = {
        "files" : files,
        "size" : size,
        "totalSize" : totalSize
    }
    console.log("total files size per graph ", totalSize);
    return response;
}

function createLoadForTask(files, size, totalSize, customLoad) {
    var maxLoad = 1024 * 1024 * 1024;
    var load = [];
    var sizeOfLoad = 0;
    if (customLoad) {
        maxLoad = customLoad;
    }

    while(totalSize > 0 && sizeOfLoad < maxLoad && files.length > 0) {
        var sizeOfFile = size.pop();
        sizeOfLoad += sizeOfFile;
        load.push(files.pop());
        totalSize -= sizeOfFile;
    }

    var response = {
        "files" : files,
        "size" : size,
        "totalSize": totalSize,
        "load": load
    }
    console.log("LOAD is ", load);
    return response;
}

function constructGraph(files, size, totalSize) {
    //add all mappers that should be the dependencies for the reducer
    var depForReducer = [];

    //add tasks to taskGraph
    for (var key in graphSkeleton) {
        if (key === "tasks") {
            //spawn as many tasks as needed using the size of the files and a maximum dimension per task
            var i = 0;
            while (totalSize > 0) {
                var ld = createLoadForTask(files, size, totalSize);
                totalSize = ld["totalSize"];
                graphSkeleton[key].push(taskModule.fabricateIndependentTask( "mapper_" + i, image, ld["load"], envVar));
                depForReducer.push("mapper_" + i);
                i++;
            }
        }
    }
    var env = getMapperTasksIdsAsEnv(depForReducer);
    for (key in graphSkeleton) {
        if (key === "tasks") {
            graphSkeleton[key].push(taskModule.fabricateDependentTask('reducer', depForReducer, ['echo', 'I am a reducer B)'], env));
        }
    }
}

function queryForSpecificFiles(url, filter) {
    request
        .post(url)
        .send(filter)
        .set('Accept', 'application/json')
        .end(function(res){
            if (res.ok) {
                var result = JSON.parse(JSON.stringify(res.body));
                var resp = parseIndexDBResponse(result);
                constructGraph(resp["files"], resp["size"], resp["totalSize"]);

                //post a taskGraph
                postGraph(taskClusterCreateGraphUrl, graphSkeleton);
            } else {
                console.log('Oh no! error ' + res.text);
            }
        });
}

function postGraph(url, graphToPost) {
    request
        .post(url)
        .send(graphToPost)
        .end(function (res) {
            if (res.ok) {
                console.log(JSON.stringify(res.body));
                var graph = "http://docs.taskcluster.net/tools/task-graph-inspector/#";
                console.log(graph + res.body.status.taskGraphId)

                //make requests for status
                var inspectUrl = "http://scheduler.taskcluster.net/v1/task-graph/" + res.body.status.taskGraphId + "/inspect";
                console.log(inspectUrl);

                request
                    .get(inspectUrl)
                    .end(function (res) {
                        console.log(res.body['tasks']);
                        var resultBody = res.body['tasks'];
                        for (var j  in resultBody) {
                            console.log("mapper id ", resultBody[j]['taskId']);
                        }
                    });

            } else {
                console.log('Oh no! error ' + res.text);
            }
        });
}
queryForSpecificFiles(myFakeServ, filter);


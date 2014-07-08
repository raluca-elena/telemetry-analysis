#!/usr/bin/env node
var request = require('superagent');
var myFakeServ = "http://localhost:8080/files";
var taskClusterCreateGraphUrl = 'http://scheduler.taskcluster.net/v1/task-graph/create';
var gskeleton = require('./GraphSkeleton');

graphSkeleton = gskeleton.graphSkeleton;
taskModule =  require('./taskFabricator');

var argv = process.argv;
argv.shift();
argv.shift();
var fs = require('fs');
var file = argv[0];
var image = argv[1];
//give me image too
//give me env variables
var data = fs.readFileSync(file, 'utf8')
data = JSON.parse(data);
filter = {"filter":data};
var result;
var files = [];
var size = [];
var totalSize = 0;

function parseIndexDBResponse(response) {
    for (var i= 0; i < response.length; i++) {
        for (var key in response[i]) {
            if (key == 'file_name') {
                files.push(response[i][key]);
            } else {
                size.push(response[i][key]);
                totalSize += response[i][key];
            }
        }
    }
}

function constructGraph() {
    //add all mappers that should be the dependencies for the reducer
    var depForReducer = [];

    //add tasks to taskGraph
    for (key in graphSkeleton) {
        if (key === "tasks") {
            //spawn as many tasks as needed using the size of the files and a maximum dimension per task
            var i = 0;
            totalSize = totalSize /(1024);
            while(totalSize >= 0) {
                console.log("------------total size at the beginning ", totalSize);
                graphSkeleton[key].push(taskModule.fabricateIndependentTask( "mapper_" + i, image));
                depForReducer.push("mapper_" + i);
                i++;
                for (var task in graphSkeleton[key]) {
                    //current total size of files per mapper
                    var loadOnMapper = 0;
                    while (loadOnMapper < (1024 * 1024) && size.length != 0) {
                        graphSkeleton[key][task]['task']['payload']['command'].push(files.pop());
                        loadOnMapper += size.pop();
                    }
                    console.log("size of load on :", graphSkeleton[key][task]['label'], "is : ", loadOnMapper);

                    totalSize = totalSize - loadOnMapper;
                    console.log("size left to distribute ", totalSize);
                }
            }
        }
    }
    for (key in graphSkeleton) {
        if (key === "tasks") {
            graphSkeleton[key].push(taskModule.fabricateDependentTask('reducer', depForReducer, ['echo', 'I am a reducer B)']));
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
                parseIndexDBResponse(result);
                console.log("total size of files is ", totalSize);
                constructGraph();
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
                var x = "http://docs.taskcluster.net/tools/task-graph-inspector/#";
                console.log(x + res.body.status.taskGraphId)

                //make requests for status
                var inspectUrl = "http://scheduler.taskcluster.net/v1/task-graph/" + res.body.status.taskGraphId + "/inspect";
                var tableAccesUrl = "http://scheduler.taskcluster.net/v1/task-graph/table-access"
                var infoUrl = "http://scheduler.taskcluster.net/v1/task-graph/" + res.body.status.taskGraphId + "/info";
                //console.log("link for info is ", info);
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


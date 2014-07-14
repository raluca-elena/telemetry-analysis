#!/usr/bin/env node
/**
 * AF.js functionality:
 * ex : ./AF.js Filter.json "registry.taskcluster.net/aaa" '{"OWNER" : "ralucaelena1985@gmail.com", "BLACK" : "black"}'
 *       script   filter            dockerImage                        { env_var : value, env_var : value}
 *
 * step1: make call for federatedToken
 * step2: encrypt with public key credentials and provide b64 encrypted credentials as CREDENTIALS env var
 * step3: query usinf Filter.json(taken as arg) to indexDB to get the specific file names and sizes of files
 * step4: create skeleton for mapper tasks and add load to them (file names from indexDB)
 * step5: push taskDefinition to graphSkeleton
 * step6: create reduce task and give it as dependencies the labels of dependent tasks
 * step7: post graph
 * step8: get taskGraph definition
 * step9: print definition of graph and link to a simple monitor page
 *
 * NOTE: the paths commented are the ones on the local machine/repo and the ones uncommented are the ones in docker
 *       image
 */
var request = require('superagent');

//this should be the db endpoint
var myFakeServ = "http://localhost:8080/files";

//post graph to this endpoint
var taskClusterCreateGraphUrl = 'http://scheduler.taskcluster.net/v1/task-graph/create';

//load graph skeleton
var gskeleton = require('./graphSkeleton');

//load module for federatedToken request
var credentialsProvider = require('./getFederationToken');
var fs = require('fs');

var graphSkeleton = gskeleton.graphSkeleton;
var taskModule =  require('./taskFabricator');

//get arguments
var argv = process.argv;

//drop node and name of script, should be replaced with some commander.js call
argv.shift();
argv.shift();

//Filter.json
var file = argv[0];
var data = fs.readFileSync(file, 'utf8')
data = JSON.parse(data);
var filter = {"filter": data};

//dockerImage
var image = argv[1];

//env vars for tasks
var envVar = argv[2] ? JSON.parse(argv[2]) : {};
var result;

//parse response given by indexDB of form [{file_name=filename size=xxx}]
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

//each task gets a load aka a list of files
function createLoadForTask(files, size, totalSize, customLoad) {
    var maxLoad = 1024 * 1024;
    var load = [];
    var sizeOfLoad = 0;
    if (customLoad) {
        maxLoad = customLoad;
    }

    while(totalSize > 0 && sizeOfLoad < maxLoad && files.length > 0 && load.length < 50) {
        var sizeOfFile = size.pop();
        sizeOfLoad += sizeOfFile;
        load.push(files.pop());
        totalSize -= sizeOfFile;
    }
    //console.log("load size for task--", sizeOfLoad);

    var response = {
        "files" : files,
        "size" : size,
        "totalSize": totalSize,
        "load": load
    }
    //console.log("load is ", load, "number of files", load.length);
    return response;
}

function constructGraph(files, size, totalSize, credentials) {
    //add all mapper labels, the dependencies for the reducer
    var depForReducer = [];

    //add tasks to taskGraph
    for (var key in graphSkeleton) {
        if (key === "tasks") {
            //spawn as many tasks as needed using the size of the files and a maximum dimension per task
            var i = 0;
            while (totalSize > 0 && i < 5) {
                var ld = createLoadForTask(files, size, totalSize);
                totalSize = ld["totalSize"];
                graphSkeleton[key].push(taskModule.fabricateIndependentTask( "mapper_" + i, image, ld["load"], envVar, credentials));
                depForReducer.push("mapper_" + i);
                i++;
            }
        }
    }
    for (key in graphSkeleton) {
        if (key === "tasks") {
            graphSkeleton[key].push(taskModule.fabricateDependentTask('reducer', depForReducer, ['node', '/opt/analysis-tools/reducer.js'], envVar, credentials));
        }
    }
}

//query indexDB for file names and sizes
function queryIndexDB(url, filter, credentials) {
    request
        .post(url)
        .send(filter)
        .set('Accept', 'application/json')
        .end(function(res){
            if (res.ok) {
                var result = JSON.parse(JSON.stringify(res.body));
                var resp = parseIndexDBResponse(result);
                constructGraph(resp["files"], resp["size"], resp["totalSize"], credentials);

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
                console.log(graph + res.body.status.taskGraphId);

                //make requests for status
                var inspectUrl = "http://scheduler.taskcluster.net/v1/task-graph/" + res.body.status.taskGraphId + "/inspect";
                console.log(inspectUrl);
                console.log("Monitor your taskGraph  here ^_^  " + "http://localhost:63342/telemetry-analysis/index.html" + "?" + res.body.status.taskGraphId);

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

function AF(credentials) {
    var base = new Buffer(JSON.stringify(credentials));
    var encodedCredentials = base.toString('base64');
    queryIndexDB(myFakeServ, filter, encodedCredentials);
}
credentialsProvider.provideCredentials(AF);

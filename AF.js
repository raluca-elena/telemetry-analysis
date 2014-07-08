#!/usr/bin/env node
var request = require('superagent');
var myFakeServ = "http://localhost:8080/files";
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
function queryForSpecificFiles(url, filter) {
        request
            .post('http://localhost:8080/files')
            .send(filter)
            .set('Accept', 'application/json')
            .end(function(res){
                if (res.ok) {
                    var result = JSON.parse(JSON.stringify(res.body));

                    for (var i= 0; i < result.length; i++) {
                        //console.log("line  ", result[i]);
                        for (var key in result[i]) {
                            if (key == 'file_name') {
                                files.push(result[i][key]);
                            }
                            if (key == 'file_size') {
                                size.push(result[i][key]);
                                totalSize += result[i][key];
                            }
                        }
                    }
                    console.log("total size of files is ", totalSize);
                    //console.log("files are", files);
                    //console.log("sizes are", size);
                    var depForReducer = [];
                    //add tasks to taskGraph
                    for (key in graphSkeleton) {
                        if (key === "tasks") {
                            //algo to spawn as many tasks as needed by using the size of the files

                            var i = 0;
                            totalSize = totalSize /(1024);
                            while(totalSize >= 0) {
                                console.log("total size at the beginning ", totalSize);
                                graphSkeleton[key].push(taskModule.fabricateIndependentTask( "mapper_" + i, image));
                                depForReducer.push("mapper_" + i);
                                i++;
                                for (var task in graphSkeleton[key]) {
                                    var loadOnMapper = 0;
                                    while (loadOnMapper < (1024 * 1024) && size.length != 0) {
                                        graphSkeleton[key][task]['task']['payload']['command'].push(files.pop());
                                        loadOnMapper += size.pop();
                                        console.log("load on mapper is ", loadOnMapper);
                                    }
                                    totalSize = totalSize - loadOnMapper;
                                    console.log("total size at this point is", totalSize);
                                }
                            }
                            //graphSkeleton[key].push(taskModule.fabricateDependentTask('reducer', depForReducer));
                            //graphSkeleton[key][task]['task']['payload']['command'] = ['echo', 'I am a reducer B)'] ;

                        }
                    }
                    for (key in graphSkeleton) {
                        if (key === "tasks") {
                                graphSkeleton[key].push(taskModule.fabricateDependentTask('reducer', depForReducer));
                                for (var task in graphSkeleton[key]) {
                                    if (graphSkeleton[key][task]['label'] === 'reducer') {
                                        console.log("AAAAAAA");
                                        graphSkeleton[key][task]['task']['payload']['command'] = ['echo', 'I am a reducer B)'];
                                        break;
                                    }
                                }
                            }
                    }



                    //post a taskGraph
                    request
                        .post('http://scheduler.taskcluster.net/v1/task-graph/create')
                        .send(graphSkeleton)
                        .end(function(res){
                            if (res.ok) {
                                console.log(JSON.stringify(res.body));
                                var x = "http://docs.taskcluster.net/tools/task-graph-inspector/#";
                                console.log(x + res.body.status.taskGraphId)

                                //make requests for status
                                var inspectUrl = "http://scheduler.taskcluster.net/v1/task-graph/" + res.body.status.taskGraphId + "/inspect";
                                var tableAccesUrl ="http://scheduler.taskcluster.net/v1/task-graph/table-access"
                                var infoUrl = "http://scheduler.taskcluster.net/v1/task-graph/" + res.body.status.taskGraphId + "/info";
                                //console.log("link for info is ", info);
                                console.log(inspectUrl);

                                    request
                                    .get(inspectUrl)
                                    .end(function(res){
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

                } else {
                    console.log('Oh no! error ' + res.text);
                }
            });


    }
queryForSpecificFiles(myFakeServ, filter);
//});


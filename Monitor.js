/**
 * Monitor.js functionality:
 * Simple loop that queries for changes in taskGraph json response. When all tasks finish stops.
 */

var url = "http://scheduler.taskcluster.net/v1/task-graph/cSdoUlWPTcmx5Ka2gbucVQ/inspect";

function constructUrl() {
    var pageUrl = window.location['href'];
    console.log("MY LOCATION IS ", pageUrl);
    var param = pageUrl.split("?")[1];
    var taskID = param.split("=")[1];
    console.log("taskId is ", taskID);
    url = "http://scheduler.taskcluster.net/v1/task-graph/" + taskID + "/inspect";
}
constructUrl();

var listOfTasks = {};

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

//add tasks to page
function createPage(){
    $.get(url, function parseResponse(data) {
        console.log(data);
        var list = [];
        for (var key in data["tasks"]) {
            list.push(key);
            console.log("KEY IS", key);
            listOfTasks[key] = true;
            var x = $('<div id="' + key + '"></ div>').text(key);
            $('#paragraph').append(x);
            setInterval(makeRecursiveRequest, 5000);
        }
    });
}

//check for updates and if all tasks ended exit from loop
function makeRecursiveRequest() {
    $.get( url, function parseResponse(data) {
        console.log(data);
        if (Object.keys(listOfTasks).length === 0) {
            console.log("-----------TASK GRAPH FINISHED CLOSE LOOP !-----------------");
            return;
        }
        for (var key in data["tasks"]) {
            if (!isEmpty(data["tasks"][key]["resolution"])) {
                if (data["tasks"][key]["resolution"]["completed"] !== undefined && listOfTasks[key] !== undefined) {
                    $('<a>',{
                        text: "   result",
                        title: 'task',
                        href: "http://docs.taskcluster.net/tools/task-inspector/#" + data["tasks"][key]['taskId']
                    }).appendTo('#'+ key);
                    var resultUrl = data["tasks"][key]["resolution"]["resultUrl"];
                    delete(listOfTasks[key]);
                }

            }
        }

        setInterval(makeRecursiveRequest, 5000);
    });
}
createPage(url);





/**
 * Created by rpodiuc on 7/9/14.
 */
var url = "http://scheduler.taskcluster.net/v1/task-graph/cSdoUlWPTcmx5Ka2gbucVQ/inspect";
function constructUrl() {
    var pageUrl = window.location['href'];
    console.log("MY LOCATION IS ", pageUrl);
    var taskID = pageUrl.split("?")[1];
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
function createPage(url){
    $.get( url, function parseResponse(data) {
        console.log(data);
        var list = [];
        for (var key in data["tasks"]) {
            list.push(key);
            console.log("KEY IS", key);
            listOfTasks[key] = true;
            var x = $('<div id="' + key + '"></ div>').text(key);
            $('#unicorn').append(x);
        }
    });
}
createPage(url);
function makeRecursiveRequest(url) {
    $.get( url, function parseResponse(data) {
        console.log(data);
        //this is a miserable hack
        if (Object.keys(listOfTasks).length === 0) {
            console.log("-----------TASK GRAPH FINISHED CLOSE LOOP !");
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
                    console.log("this is my castle!");
                    delete(listOfTasks[key]);
                }

            }
        }

        makeRecursiveRequest(url);
    });
}
setTimeout(function() {
    makeRecursiveRequest(url);
}, 4000);






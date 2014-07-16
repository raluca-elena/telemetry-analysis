telemetry-analysis
==================
This repo provides a framework to post task graphs to TaskCluster.

![Alt text](https://raw.githubusercontent.com/raluca-elena/telemetry-analysis/master/resDoc/img.jpg)

Requirements:
  * AWS Credentials
  * customized Docker Image
  * TaskCluster Credentials 



###AWS Credentials

AF uses `STS temporary credentials` so you need to have a user that has enabled a policy that authorise it to generate FederatedToken credentials for your graph. 
More about STS: http://docs.aws.amazon.com/STS/latest/UsingSTS/Welcome.html

The temporary STS credentials must be encrypted so you need to have a public key on your machine and put a private one in the Docker image.

###Customised Docker Image
Depending on what you want to execute as a task you need to customize a Docker image.

You can find one documented example in this repo:

https://github.com/raluca-elena/telemetry-analysis-base

##AF functionality

AF takes as arguments a `Filter.json`, a `Docker image` and optionally some other arguments that will be set as environment variables in the tasks definition.

 * Makes a call for Federated Token
 * Encrypts credentials
 * Makes a query to IndexDB and gets a list of files and sizes
 * Splits the list into loads for tasks
 * Constructs mapper task definition by adding `credentials` `file load` and `custom image`
 * Inserts tasks in Graph Skeleton
 * Constructs reducer, dependent task, that takes as argument mapper tasks ids
 * Posts graph
 
##Monitor TaskGraph
 * AF prints in console 3 links: 
     1. link to task graph inspector
     2. link to the specification of the task graph
     3. link to a simple html page that monitors when your graph has finished executing
  








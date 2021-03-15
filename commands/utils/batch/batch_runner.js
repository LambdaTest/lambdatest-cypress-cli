const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const constants = require('../constants.js')
const uploader = require("../uploader.js")
const process = require("process")
const archive = require("../archive.js")
const { url } = require('inspector')
const WebSocket = require('ws')
const { type } = require('os')


var batchCounter = 0
var totalBatches = 0
function run_single_batch(connection, batch, lt_config, env){
    console.log("Executing batch %d at Lambdatest", (parseInt(batchCounter) + 1))

    lt_config["test_suite"] = batch
    archive.archive_batch(lt_config, batch, env).then(async function (file_obj) {
        fs.readFile(file_obj["name"], '', function(err, data) {
            if (err) throw err;
            // console.log(data);
            var x = JSON.stringify({
                'file_data': data,
                'username': lt_config["lambdatest_auth"]["username"],
                'access_key': lt_config["lambdatest_auth"]["access_key"]
            })
            connection.send(x)
        });
        
    })
    batchCounter += 1
}

async function run(lt_config, batches, env, i = 0) {
    totalBatches = batches.length
    console.log("Total number of batches " + totalBatches)
    return new Promise(function (resolve, reject) {
        //archive the project i.e the current working directory
        archive.archive_project(lt_config["run_settings"]["ignore_files"]).then(function (file_obj) {
            project_file = file_obj["name"]
            //upload the project and get the project link
            uploader.upload_project(lt_config, file_obj["name"], env).then(async function (resp) {

                // TODO: remove hard check for undefined. handle it using nested promise rejection
                if (resp == undefined){
                    console.log("Either your creds are invalid or something is wrong with the configs provided")
                    return
                }
                //add project link in lt config
                lt_config["run_settings"]["project_url"] = resp["value"]["message"]

                endPointUrl = constants[env].INTEGRATION_BASE_URL + constants.RUN_WS_URL
                // all this needs to be done inside a websocket event loop
                const connection = new WebSocket(endPointUrl)

                connection.onopen = () => {
                    run_single_batch(connection, batches[batchCounter], lt_config, env )
                    
                }

                connection.onerror = (error) => {
                    console.log(`WebSocket error: ${error}`)
                    return
                }
                connection.onclose = (event) => {
                    archive.delete_archive(project_file)
                    resolve("done")
                }
                connection.onmessage = (e) => {
                    
                    // if message received says that the batch is successfully executed, send next batch
                    receivedMessage = e.data
                    var jObject = JSON.parse(e.data); 
                    if (jObject.statusCode == "200"){
                        console.log("Batch %d Completed. Build URL: ", batchCounter, jObject.dashboardURL)
                        if (batchCounter < totalBatches){
                            run_single_batch(connection, batches[batchCounter], lt_config, env )
                        }else{
                            // all batches have run, hence close connection
                            console.log("All batches ran")
                            connection.close()
                        }
                        
                    }else if(jObject.statusCode == 400){
                        console.log("Something is wrong with the way you are running test. Reason: "+ jObject.errMsg)
                        console.log("closing ws connection")
                        connection.close()

                    }else if (jObject.statusCode == 500){
                        console.log("Something went wrong on the server side. Please report")
                        console.log("closing ws connection")
                        connection.close()

                    }
                
                }

                // for (i in batches) {
                //     console.log("Executing batch %d at Lambdatest", (parseInt(i) + 1))
                //     lt_config["test_suite"] = batches[i]
                //     await archive.archive_batch(lt_config, batches[i], env).then(async function (file_obj) {
                //         console.log("Archived %d batch", (parseInt(i) + 1))
                //         await uploader.upload_file(lt_config, file_obj["name"], env).then(function (resp) {
                //             resp_json = JSON.parse(resp["value"]["message"])
                //             console.log("Dashboard Url: %s", resp_json["dashboard_url"])
                //             console.log("Total %d:", resp_json["total"])
                //             console.log("Errors: %d", resp_json["errors"])
                //             console.log("Run %d:", resp_json["total"] - resp_json["errors"])
                //             // archive.delete_archive(file_obj['name'])
                //         }).catch(function (err) {
                //             console.log(err)
                //             // archive.ls(file_obj["name"])
                //         })
                //     })

                // }
                // archive.delete_archive(project_file)
                // console.log("going to resolve promise")
                // resolve("done")
            }).catch(function (err) {
                console.log(err)
                archive.delete_archive(project_file)
                reject(err)
            })
        }).catch(function (err) {
            console.log(err)
            reject(err)
        })
    })

}


module.exports = {
    run_batches: run
}
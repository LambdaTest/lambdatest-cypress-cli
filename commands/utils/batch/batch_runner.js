const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const constants = require('../constants.js')
const uploader = require("../uploader.js")
const process = require("process")
const archive = require("../archive.js")


async function run(lt_config, batches, env, i = 0) {

    return new Promise(function (resolve, reject) {
        //archive the project i.e the current working directory
        archive.archive_project(lt_config["run_settings"]["ignore_files"]).then(function (file_obj) {
            project_file = file_obj["name"]
            //upload the project and get the project link
            uploader.upload_project(lt_config, file_obj["name"], env).then(async function (resp) {
                //add project link in lt config
                lt_config["run_settings"]["project_url"] = resp["value"]["message"]
                console.log("Project Uploaded")
                console.log("Executing batches")
                for (i in batches) {
                    console.log("Executing batch %d at Lambdatest", (parseInt(i) + 1))
                    lt_config["test_suite"] = batches[i]
                    await archive.archive_batch(lt_config, batches[i], env).then(async function (file_obj) {
                        console.log("Archived %d batch", (parseInt(i) + 1))
                        await uploader.upload_file(lt_config, file_obj["name"], env).then(function (resp) {
                            resp_json = JSON.parse(resp["value"]["message"])
                            console.log("Dashboard Url: %s", resp_json["dashboard_url"])
                            console.log("Total %d:", resp_json["total"])
                            console.log("Errors: %d", resp_json["errors"])
                            console.log("Run %d:", resp_json["total"] - resp_json["errors"])
                            archive.delete_archive(file_obj['name'])
                        }).catch(function (err) {
                            console.log(err)
                            archive.delete_archive(file_obj["name"])
                        })
                    })

                }
                archive.delete_archive(project_file)
            }).catch(function (err) {
                console.log(err)
                archive.delete_archive(project_file)
            })
        }).catch(function (err) {
            console.log(err)
        })

    })

}


module.exports = {
    run_batches: run
}
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const constants = require("../constants.js");
const uploader = require("../uploader.js");
const process = require("process");
const archive = require("../archive.js");
const WebSocket = require("ws");
const { type } = require("os");
const request = require("request");
const { del } = require("request");
const { delete_archive } = require("../archive.js");
const poller = require("../poller/poller.js");
const builds = require("../poller/build");

var batchCounter = 0;
var totalBatches = 0;

function run_test(payload, env = "prod", rejectUnauthorized) {
  return new Promise(function (resolve, reject) {
    let options = {
      url: constants[env].INTEGRATION_BASE_URL + constants.RUN_URL,
      body: payload,
    };
    if (rejectUnauthorized == false) {
      options["rejectUnauthorized"] = false;
    }
    let responseData = null;
    request.post(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        try {
          responseData = JSON.parse(body);
        } catch (e) {
          console.log("Error in JSON response", body);
          responseData = null;
        }
        if (resp.statusCode != 200) {
          if (responseData && responseData["error"]) {
            reject(responseData["error"]);
          } else {
            reject(responseData);
          }
        } else {
          build_id = responseData["value"]["message"]
            .split("=")
            [responseData["value"]["message"].split("=").length - 1].split(
              "&"
            )[0];
          session_id = responseData["value"]["message"]
            .split("=")
            [responseData["value"]["message"].split("=").length - 1].split(
              "&"
            )[1];
          if (parseInt(build_id) == 0) {
            reject("Some Error occured on Lambdatest Server");
          } else {
            //Write session_id to a file
            data = { build_id: build_id, session_id: session_id };
            fs.writeFileSync(
              "lambdatest_run.json",
              JSON.stringify(data, null, 3)
            );
            console.log(
              `Uploaded tests successfully `,
              responseData["value"]["message"].substr(
                0,
                responseData["value"]["message"].length -
                  (session_id.length + 1)
              )
            );
            resolve(session_id);
          }
        }
      }
    });
  });
}

async function run(lt_config, batches, env) {
  totalBatches = batches.length;
  //console.log("Total number of batches " + totalBatches);
  return new Promise(function (resolve, reject) {
    //archive the project i.e the current working directory
    archive
      .archive_project(lt_config)
      .then(function (file_obj) {
        project_file = file_obj["name"];
        //upload the project and get the project link
        uploader
          .upload_zip(lt_config, file_obj["name"], "project", env)
          .then(async function (resp) {
            // TODO: remove hard check for undefined. handle it using nested promise rejection
            if (resp == undefined) {
              console.log(
                "Either your creds are invalid or something is wrong with the configs provided"
              );
              return;
            }
            //add project link in lt config
            project_url = resp["value"]["message"].split("?")[0].split("/");
            project_url = project_url[project_url.length - 1];
            lt_config["run_settings"]["project_url"] = project_url;
            lt_config["test_suite"] = batches[0];
            archive
              .archive_batch(lt_config, batches[0], env)
              .then(async function (file_obj) {
                uploader
                  .upload_zip(lt_config, file_obj["name"], "tests", env)
                  .then(async function (resp) {
                    var payload = JSON.stringify({
                      payload: {
                        test_file: resp["value"]["message"].split("?")[0],
                      },
                      username: lt_config["lambdatest_auth"]["username"],
                      access_key: lt_config["lambdatest_auth"]["access_key"],
                      type: "cypress"
                    });

                    run_test(
                      payload,
                      env,
                      lt_config.run_settings.reject_unauthorized
                    )
                      .then(function (session_id) {
                        delete_archive(project_file);
                        delete_archive(file_obj["name"]);
                        //listen to control+c signal and stop tests
                        process.on("SIGINT", async () => {
                          try {
                            console.log(
                              "Control+c signal received.\nTrying to Terminate the processes"
                            );
                            await builds.stop_cypress_session(
                              lt_config,
                              session_id,
                              env
                            );
                            resolve(0);
                          } catch (e) {
                            console.log("Could not exit process. Try Again!!!");
                          }
                        });
                        if (
                          lt_config["run_settings"]["sync"] == true ||
                          lt_config["tunnel_settings"]["tunnel"] == true
                        ) {
                          console.log("Waiting for build to finish...");
                          poller
                            .poll_build(lt_config, session_id, env)
                            .then(function (exit_code) {
                              resolve(exit_code);
                            })
                            .catch(function (err) {
                              console.log(
                                "Some error occured in getting build updates",
                                err.message
                              );
                            });
                        } else {
                          resolve(0);
                        }
                      })
                      .catch(function (err) {
                        console.log("Error occured while creating tests", err);
                      });
                  })
                  .catch(function (err) {
                    delete_archive(file_obj["name"]);
                    console.log("Error occured while uploading files ", err);
                  });
              })
              .catch(function (err) {
                console.log("Not able to archive the batch of test files", err);
              });
          })
          .catch(function (err) {
            console.log(err);
            archive.delete_archive(project_file);
            reject(err);
          });
      })
      .catch(function (err) {
        console.log("Unable to archive the project");
        console.log(err);
        reject(err);
      });
  });
}

module.exports = {
  run_batches: run,
};

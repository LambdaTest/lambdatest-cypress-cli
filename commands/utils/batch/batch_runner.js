const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const constants = require("../constants.js");
const uploader = require("../uploader.js");
const process = require("process");
const archive = require("../archive.js");
const WebSocket = require("ws");
const { type } = require("os");
const { delete_archive } = require("../archive.js");
const poller = require("../poller/poller.js");
const builds = require("../poller/build");
const batcher = require("./batcher.js");
const reports = require("../../../commands/generate_reports.js");
const { fail } = require("yargs");
const https = require('https');
const axios = require('axios');

var batchCounter = 0;
var totalBatches = 0;

function run_test(payload, env = "prod", rejectUnauthorized) {
  return new Promise(function (resolve, reject) {
    let options = {
      url: constants[env].INTEGRATION_BASE_URL + constants.RUN_URL,
      data: payload,
    };
    if (rejectUnauthorized == false) {
      options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
    let responseData = null;

    axios.post(options.url, options.data, options)
    .then(response => {
      responseData = response.data;
      // console.log(response);
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
            smartuiLink = responseData["value"]["smartuiLink"]
            if (smartuiLink !== undefined && smartuiLink !== "") {
            console.log('SmartUI link for the project: ' + smartuiLink)
            }
            resolve(session_id);
          }
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status != 200) {
          if (error.response && error.response.data) {
          reject(error.response.data);
          } else {
            reject(error.response);
          }
        } else {
          reject(error.response);
        }
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        reject(error.cause);
      } else {
        reject(error);
      }
      })

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
        lt_config["run_settings"]["project_file"] = project_file;
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
                        if (!lt_config["run_settings"]["retry_failed"]) {
                          delete_archive(project_file);
                        }
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
                          (lt_config["tunnel_settings"]["tunnel"] && lt_config["tunnel_settings"]["autostart"]) || (lt_config["run_settings"]["retry_failed"] == true )
                        ) {
                          console.log("Waiting for build to finish...");
                          poller.update_status(true);
                          poller.poll_build(lt_config, session_id, env)
                            .then( function (result) {
                              const { exit_code, build_info } = result;
                              if (lt_config["run_settings"]["retry_failed"] == true && build_info != null ) {
                                let failed_test_suites = [];
                                for (i = 0; i < build_info["data"].length; i++) {
                                  if (build_info["data"][i]["status_ind"] == "failed") {
                                    let failed_spec = findSpecFile(lt_config["test_suite"],build_info["data"][i])
                                    let failed_suite = {
                                      spec_file: failed_spec,
                                      path: build_info["data"][i]["path"],
                                      browser: build_info["data"][i]["browser"],
                                      version: build_info["data"][i]["version"],
                                      platform: build_info["data"][i]["platform"]
                                    }
                                    failed_test_suites.push(failed_suite);
                                  }
                                }
                                if (failed_test_suites.length > 0) {
                                  console.log("Retrying failed tests.")
                                  let batches = [failed_test_suites]
                                    retry_run(lt_config, batches, env)
                                    .then(function (exit_code) {
                                      if (exit_code) {
                                      console.log("retried failed tests ended with exit code " + exit_code);
                                      }
                                      resolve(exit_code);
                                    })
                                    .catch(function (error) {
                                      console.log(error);
                                      resolve(1);
                                    });                                 
                                } else {
                                  resolve(exit_code);
                                }
                              } else {
                                resolve(exit_code);
                              }
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

async function retry_run(lt_config, batches, env) {
  totalBatches = batches.length;
  return new Promise(function (resolve, reject) {
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
        ).then(function (session_id) {
          
          delete_archive(lt_config["run_settings"]["project_file"]);
          delete_archive(file_obj["name"]);
          
          process.on("SIGINT", async () => {
            try {
              console.log(
                "Retry - Control+c signal received.\nTrying to Terminate the processes"
              );
              await builds.stop_cypress_session(
                lt_config,
                session_id,
                env
              );
              resolve(0);
            } catch (e) {
              console.log("Retry - Could not exit process. Try Again!!!");
            }
          });
          if (
            lt_config["run_settings"]["sync"] == true ||
            (lt_config["tunnel_settings"]["tunnel"] && lt_config["tunnel_settings"]["autostart"])
          ) {
            console.log("Retry - Waiting for build to finish...");
            poller.update_status(true);
            poller.poll_build(lt_config, session_id, env)
              .then(function (result) {
                const { exit_code, build_json } = result;
                resolve(exit_code);
              })
              .catch(function (err) {
                console.log(
                  "Retry - Some error occured in getting build updates",
                  err.message
                );
              });
          } else {
            resolve(0);
          }

        })
        .catch(function (err) {
          console.log("Retry - Error occured while creating tests", err);
        });


      })
      .catch(function (err) {
        console.log("Retry - Not able to archive the batch of test files", err);
      });

    })
    .catch(function (err) {
      console.log("Retry - Unable to archive the project");
      console.log(err);
      reject(err);
    });
  });
}

function findSpecFile(testSuite, buildInfoData) {
  const foundTest = testSuite.find((test) => test.path === buildInfoData.path);
  return foundTest ? foundTest.spec_file : null;
}

module.exports = {
  run_batches: run,
  run_batches_retry: retry_run,
};

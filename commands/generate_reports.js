const https = require('https');
const axios = require('axios');
const constants = require("./utils/constants.js");
const process = require("process");
const build_stats = require("./utils/poller/build_stats.js");
const { access } = require("fs");
var fs = require("fs");
const StreamZip = require("node-stream-zip");
const path = require("path");

function download_artefact(
  username,
  access_key,
  env,
  test_id,
  file_path,
  rejectUnauthorized
) {
  return new Promise(function (resolve, reject) {
    let response_code;
    let resp;
    if (!fs.existsSync(file_path)) {
      fs.mkdirSync(file_path, { recursive: true });
    }
    let old_path = file_path;
    //Create an empty file
    file_path = path.join(file_path, "artefacts.zip");
    const stream = fs.createWriteStream(file_path);
    stream.end();
    let options = {
      method: 'get',
      url: constants[env].REPORT_URL + test_id,
      auth: {
        username: username,
        password: access_key,
      },
      gzip: true,
      timeout: 120000,
      responseType: 'stream'
    };
    if (rejectUnauthorized == false) {
      options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
      console.log("Setting rejectUnauthorized to false for web requests");
    }

    axios(options)
    .then((response) => {
      response_code = response.status;
      resp = response;
      const writer = fs.createWriteStream(file_path, {overwrite: true,});
      response.data.pipe(writer);

      writer.on('finish', function () {
        if (response_code == 200) {
          const zip = new StreamZip({ file: file_path });
            zip.on("ready", () => {
              zip.extract(null, old_path, (err, count) => {
                zip.close();
                fs.unlinkSync(file_path);
                resolve(
                  err
                    ? "Extract error for " + test_id
                    : `Extracted ${count} entries for ` + test_id
                );
              });
            })
        }
       });

      writer.on('error', (err) => {
        console.error('Error writing to file:', err);
        fs.unlinkSync(file_path); // Cleanup on error
        reject('Error writing to file for test id ' + test_id);
      });

    })
    .catch((error) => {

      if (error.response) {
        resp = error.response
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("Got error:",error.response);
        if (error.response.status == 401) {
          resolve("Unauthorized");
        } else {
          fs.unlinkSync(file_path);
          if (resp.data != null) {
            const responseObject = resp.data;
            const dataValue = responseObject.data;
            if (dataValue != null) {
              reject("Could not download artefacts for test id " + test_id + " with reason " + dataValue);
            } else {
              reject("Could not download artefacts for test id " + test_id);
            }
          }
          reject("Could not download artefacts for test id " + test_id);
        }
      } else if (error.request) {
        console.log(error.cause);
      } else {
        console.log("Got error:",error.toJSON());
        reject(error);
      }
     
    });


  });
}

function generate_report(args) {
  return new Promise(async function (resolve, reject) {
    var username = "";
    var access_key = "";

    //Check for username
    if ("user" in args) {
      username = args.user;
    } else if (process.env.LT_USERNAME) {
      console.log("Setting Username from ENV", process.env.LT_USERNAME);
      username = process.env.LT_USERNAME;
    } else {
      reject("Username not provided");
    }

    //Check for access key
    if ("access_key" in args) {
      access_key = args.access_key;
    } else if (process.env.LT_ACCESS_KEY) {
      console.log("Setting Access Key from ENV");
      access_key = process.env.LT_ACCESS_KEY;
    } else {
      reject("Access Key not provided");
    }
    //Check for session id
    if (
      !("session_id" in args) ||
      args["session_id"] == "" ||
      args["session_id"] == undefined
    ) {
      const file_path = "lambdatest_run.json";
      if (fs.existsSync(file_path)) {
        let lambda_run = fs.readFileSync(file_path);
        try {
          let lambda_run_obj = JSON.parse(lambda_run);
          if (!("session_id" in lambda_run_obj)) {
            throw new Error("session_id is missing from the file");
          }
          args.session_id = lambda_run_obj.session_id;
        } catch (e) {
          reject(
            "Error!! lambdatest_run.json file is tampered Err: " + e.message
          );
        }
      } else {
        reject(
          "Error!! Last session details not found, lambdatest_run.json file not present!!"
        );
      }
    }
    //set working enviornment
    var env = "prod";
    if ("env" in args) {
      if (constants.ENVS.includes(args["env"])) {
        env = args["env"];
      } else {
        console.log(
          "Environment can be stage,stage_new, beta or prod, setting Env to prod"
        );
      }
    }

    //paylaod required for authentication
    build_payload = {
      lambdatest_auth: {
        username: username,
        access_key: access_key,
      },
      run_settings: {
        reject_unauthorized: true,
      },
    };

    if ("reject_unauthorized" in args) {
      if (
        args["reject_unauthorized"] != "false" &&
        args["reject_unauthorized"] != "true" &&
        args["reject_unauthorized"] != true &&
        args["reject_unauthorized"] != false
      ) {
        console.log("reject_unauthorized has to boolean");
        return;
      } else {
        if (args["reject_unauthorized"] == "false") {
          build_payload["run_settings"]["reject_unauthorized"] = false;
          console.log("Setting rejectUnauthorized to false for web requests");
        }
      }
    }
    build_stats
      .get_completed_build_info(build_payload, args["session_id"], env)
      .then(function (build_info) {
        if (!build_info || build_info.data == null) {
          reject("Session not found");
          return;
        }
        let directory = path.join(
          ".",
          "lambdatest-artefacts",
          args["session_id"]
        );
        //Reject if there are no tests in sessions
        if (build_info["data"].length == 0) {
          reject("No tests in this session");
        }
        console.log("Creating directories");
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
          console.log("Directory created ", directory);
        }
        const downloadPromises = [];

        for (i = 0; i < build_info["data"].length; i++) {
          const downloadPromise = download_artefact(
            username,
            access_key,
            env,
            build_info["data"][i]["test_id"],
            path.join(
              directory,
              build_info["data"][i]["browser"],
              build_info["data"][i]["version"],
              build_info["data"][i]["test_id"]
            ),
            build_payload["run_settings"]["reject_unauthorized"]
          )
          downloadPromises.push(downloadPromise)
        }

        Promise.allSettled(downloadPromises)
        .then((results) => {
          // results is an array of objects
          for (const result of results) {
            if (result.status == 'fulfilled') {
              console.log(result.value);
            } else if (result.status == 'rejected') {
              console.log(result.reason);
            }
          }
          resolve("Done");
        })
        .catch((error) => {
          // This catch block will not be executed
          console.log(error);
          resolve("Done");
        });

      })
      .catch(function (err) {
        console.log("Error occured while getting the build response", err);
      });
  });
}

function generate_report_command(args) {
  generate_report(args)
    .then(function (resp) {})
    .catch(function (err) {
      console.log("ERR:", err);
    });
};

module.exports =  {
    generate_report:generate_report,
    generate_report_command:generate_report_command
};

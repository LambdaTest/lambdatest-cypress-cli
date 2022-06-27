const request = require("request");
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
    if (!fs.existsSync(file_path)) {
      fs.mkdirSync(file_path, { recursive: true });
    }
    let old_path = file_path;
    //Create an empty file
    file_path = path.join(file_path, "artefacts.zip");
    const stream = fs.createWriteStream(file_path);
    stream.end();
    let options = {
      url: constants[env].REPORT_URL + test_id,
      auth: {
        username: username,
        password: access_key,
      },
      gzip: true,
      timeout: 120000,
    };
    if (rejectUnauthorized == false) {
      options["rejectUnauthorized"] = false;
      console.log("Setting rejectUnauthorized to false for web requests");
    }

    request(options, (err, res, body) => {
      if (err) {
        reject(err);
      }
      response_code = res.statusCode;
    }).pipe(
      fs
        .createWriteStream(file_path, {
          overwrite: true,
        })
        .on("finish", function () {
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
            });
          } else {
            fs.unlinkSync(file_path);
            reject("Could not download artefacts for test id " + test_id);
          }
        })
    );
  });
}

function generate_report(args) {
  return new Promise(function (resolve, reject) {
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
        args["reject_unauthorized"] != "true"
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
        for (i = 0; i < build_info["data"].length; i++) {
          download_artefact(
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
            .then(function (resp) {
              //Files downloaded
              console.log(resp);
            })
            .catch(function (err) {
              console.log(err);
            });
        }
        resolve("Done");
      })
      .catch(function (err) {
        console.log("Error occured while getting the build response", err);
      });
  });
}

module.exports = function (args) {
  generate_report(args)
    .then(function (resp) {})
    .catch(function (err) {
      console.log("ERR:", err);
    });
};

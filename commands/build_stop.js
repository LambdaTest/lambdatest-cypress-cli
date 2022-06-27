const request = require("request");
const constants = require("./utils/constants.js");
const process = require("process");
const fs = require("fs");
function stop_session(args) {
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
      console.log("Setting Access Key from ENV", process.env.LT_ACCESS_KEY);
      access_key = process.env.LT_ACCESS_KEY;
    } else {
      reject("Access Key not provided");
    }
    if ("stop_last_session" in args) {
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
    } else {
      if (
        !("session_id" in args) ||
        args["session_id"] == "" ||
        args["session_id"] == undefined
      ) {
        reject("Error!! Please provide a Session ID");
      }
    }
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

    let options = {
      url: constants[env].BUILD_STOP_URL + args.session_id,
      headers: {
        Authorization: "Token " + access_key,
        Username: username,
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
          options["rejectUnauthorized"] = false;
          console.log("Setting rejectUnauthorized to false for web requests");
        }
      }
    }
    request.put(options, function (err, resp, body) {
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
            console.log(responseData);
            reject("error", responseData);
          }
        } else {
          if (responseData.length == 0) {
            resolve("No tests to stop in session " + args.session_id);
          }
          resolve(
            "Session Stopped successfully, No. of tests stopped are: " +
              responseData.length
          );
        }
      }
    });
  });
}

module.exports = function (args) {
  stop_session(args)
    .then(function (resp) {
      console.log(resp);
    })
    .catch(function (err) {
      console.log(err);
    });
};

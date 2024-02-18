const https = require('https');
const axios = require('axios');
const constants = require("./utils/constants.js");
const process = require("process");
const fs = require("fs");
function stop_build(args) {
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
    if ("stop_last_build" in args) {
      const file_path = "lambdatest_run.json";
      if (fs.existsSync(file_path)) {
        let lambda_run = fs.readFileSync(file_path);
        try {
          let lambda_run_obj = JSON.parse(lambda_run);
          if (!("build_id" in lambda_run_obj)) {
            throw new Error("build_id is missing from the file");
          }
          args.build_id = lambda_run_obj.build_id;
        } catch (e) {
          reject(
            "Error!! lambdatest_run.json file is tampered Err: " + e.message
          );
        }
      } else {
        reject(
          "Error!! Last Build details not found, lambdatest_run.json file not present!!"
        );
      }
    } else {
      if (
        !("build_id" in args) ||
        args["build_id"] == "" ||
        args["build_id"] == undefined
      ) {
        reject("Error!! Please provide a Build ID");
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
      method: 'put',
      url: constants[env].BUILD_STOP_URL + "?buildId=" + args.build_id,
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
          options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
          console.log("Setting rejectUnauthorized to false for web requests");
        }
      }
    }
   
    axios(options)
    .then(response => {
      if(response.data.length == 0){  
        resolve("No tests to stop in build " + args.build_id);
      } else {
        resolve(
          "Build Stopped successfully, No. of tests stopped are: " +
          response.data.length
        );
      }
    })
    .catch(error => {
      if (error.response != null) {
        if (error.response.status != 200) {
          reject(error.response.data)
        }
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
        reject(error.cause);
      } else {
        reject(error);
      }
    })


  });
}

module.exports = function (args) {
  stop_build(args)
    .then(function (resp) {
      console.log(resp);
    })
    .catch(function (err) {
      console.log(err);
    });
};

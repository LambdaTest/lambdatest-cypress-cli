const request = require("request");
const constants = require("./utils/constants.js");
const process = require("process");

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

    if (
      !("buildId" in args) ||
      args["buildid"] == "" ||
      args["buildid"] == undefined
    ) {
      reject("Please provide a build ID");
    }
    var env = "prod";
    if ("env" in args) {
      if (constants.ENVS.includes(args["env"])) {
        env = args["env"];
      } else {
        console.log(
          "Environment can be stage, beta or prod, setting Env to prod"
        );
      }
    }

    let options = {
      url: constants[env].BUILD_STOP_URL + args.buildId,
      headers: {
        Authorization: "Token " + access_key,
        Username: username,
      },
    };
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
          resolve("Build Stopped successfully");
        }
      }
    });
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

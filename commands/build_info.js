const request = require("request");
const constants = require("./utils/constants.js");
const process = require("process");

function get_build_info(args) {
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

    if (!("buildId" in args)) {
      reject("Please provide a build ID");
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
      url: constants[env].BUILD_BASE_URL + args.buildId,
      auth: {
        username: username,
        password: access_key,
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

    request.get(options, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        if (res.statusCode == "401") {
          resolve("Unauthorized");
        } else if (JSON.parse(body).status == "success") {
          resolve(JSON.parse(body).data);
        } else {
          resolve(JSON.parse(body).message);
        }
      }
    });
  });
}

module.exports = function (args) {
  get_build_info(args)
    .then(function (resp) {
      console.log(resp);
    })
    .catch(function (err) {
      console.log(err);
    });
};

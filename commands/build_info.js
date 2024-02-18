const https = require('https');
const axios = require('axios');
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
      method: 'get',
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
          options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
          console.log("Setting rejectUnauthorized to false for web requests");
        }
      }
    }

    axios(options)
    .then(response => {
      if (response.data.status == "success") {
        resolve(response.data.data);
      } else {
        resolve(response.data.message);
      }
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status == 401) {
          resolve("Unauthorized");
        } else {
          console.log(error.response.data);
        }
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.cause);
      } else {
        reject(error);
      }
    })
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

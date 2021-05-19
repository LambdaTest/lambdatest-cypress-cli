const constants = require("../constants");
const request = require("request");
//const poller=require("./poller.js")

function get_completed_build_info(lt_config, build_id, env) {
  return new Promise(function (resolve, reject) {
    request(
      constants[env].SESSION_URL + build_id,
      {
        auth: {
          username: lt_config["lambdatest_auth"]["username"],
          password: lt_config["lambdatest_auth"]["access_key"],
        },
      },
      (err, res, body) => {
        if (err) {
          reject(err);
        }
        if (res.statusCode == "401") {
          reject("Unauthorized");
        } else if (res.statusCode == "200") {
          resolve(JSON.parse(body));
        } else {
          console.log(body);
          reject("No response for build status");
        }
      }
    );
  });
}

function get_build_info(lt_config, build_id, env, update_status, callback) {
  
  request(
    constants[env].SESSION_URL + build_id + constants.BUILD_END_STATES,
    {
      auth: {
        username: lt_config["lambdatest_auth"]["username"],
        password: lt_config["lambdatest_auth"]["access_key"],
      },
    },
    (err, res, body) => {
      if (err) {
        //reject(err);
        update_status(false);
        return callback("Error occured while checking build status");
      }
      if (res.statusCode == "401") {
        update_status(false);
        return callback("Unauthorized");
      } else if (res.statusCode == "200") {
        resp = JSON.parse(body);
        if (resp["Meta"]["result_set"]["count"] == 0) {
          update_status(false);
          return callback(null, JSON.parse(body));
        }
        return setTimeout(callback, 5000, null);
      } else {
        update_status(false);
        return callback("No response for build status");
      }
    }
  );
}

module.exports = {
  get_build_info: get_build_info,
  get_completed_build_info: get_completed_build_info,
};

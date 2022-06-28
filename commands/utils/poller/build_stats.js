const constants = require("../constants");
const request = require("request");
const builds = require("./build");
//const poller=require("./poller.js")

function get_completed_build_info(lt_config, session_id, env) {
  let options = {
    url: constants[env].SESSION_URL + session_id,
    auth: {
      username: lt_config["lambdatest_auth"]["username"],
      password: lt_config["lambdatest_auth"]["access_key"],
    },
  };

  if (lt_config.run_settings.reject_unauthorized == false) {
    options["rejectUnauthorized"] = false;
  }

  return new Promise(function (resolve, reject) {
    request.get(options, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        if (res.statusCode == "401") {
          reject("Unauthorized");
        } else if (res.statusCode == "200") {
          resolve(JSON.parse(body));
        } else {
          console.log(body);
          reject("No response for build status");
        }
      }
    });
  });
}

function get_build_info(lt_config, session_id, env, update_status, callback) {
  let options = {
    url: constants[env].SESSION_URL + session_id + constants.BUILD_END_STATES,
    auth: {
      username: lt_config["lambdatest_auth"]["username"],
      password: lt_config["lambdatest_auth"]["access_key"],
    },
  };

  if (lt_config.run_settings.reject_unauthorized == false) {
    options["rejectUnauthorized"] = false;
  }
  request.get(options, async (err, res, body) => {
    if (err) {
      //reject(err);
      update_status(false);
      console.log(err);
      return callback("Error occured while checking build status");
    }
    if (res.statusCode == "401") {
      update_status(false);
      return callback("Unauthorized");
    } else if (res.statusCode == "200") {
      let statsNew = {
        running: 0,
        queued: 0,
        created: 0,
        initiated: 0,
        pqueued: 0,
        error: 0,
        "lambda error": 0,
        failed: 0,
      };
      let build_info = JSON.parse(body);
      if (build_info.Meta.result_set.count > 0) {
        for (i = 0; i < build_info["data"].length; i++) {
          statsNew[build_info["data"][i]["status_ind"]] += 1;
        }
      }
      if (
        statsNew["running"] +
          statsNew["queued"] +
          statsNew["created"] +
          statsNew["initiated"] +
          statsNew["pqueued"] ==
        0
      ) {
        update_status(false);
        return callback(null, JSON.parse(body));
      }
      //Stop the tests if stop on failure is enabled and we get an errored/failed/lambda errored test
      if (lt_config.run_settings.stop_on_failure == true) {
        if (
          statsNew["error"] + statsNew["lambda error"] + statsNew["failed"] >
          0
        ) {
          await builds.stop_cypress_session(lt_config, session_id, env);
        }
      }
      return setTimeout(callback, 5000, null);
    } else {
      update_status(false);
      return callback("No response for build status");
    }
  });
}

module.exports = {
  get_build_info: get_build_info,
  get_completed_build_info: get_completed_build_info,
};

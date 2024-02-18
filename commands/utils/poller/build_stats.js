const constants = require("../constants");
const builds = require("./build");
const https = require('https');
const axios = require('axios');
var get_build_info_count = 0;

function get_completed_build_info(lt_config, session_id, env) {
  let options = {
    method: 'get',
    url: constants[env].SESSION_URL + session_id,
    auth: {
      username: lt_config["lambdatest_auth"]["username"],
      password: lt_config["lambdatest_auth"]["access_key"],
    },
  };

  if (lt_config.run_settings.reject_unauthorized == false) {
    options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  return new Promise(function (resolve, reject) {
    axios(options)
    .then(response => {
      resolve(response.data);
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status == 401) {
          reject("Unauthorized");
        } else {
          console.log(error.response.data);
          reject("No response for build status");
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

function get_build_info(lt_config, session_id, env, update_status, callback) {
  let options = {
    method: 'get',
    url: constants[env].SESSION_URL + session_id + constants.BUILD_END_STATES,
    auth: {
      username: lt_config["lambdatest_auth"]["username"],
      password: lt_config["lambdatest_auth"]["access_key"],
    },
  };

  if (lt_config.run_settings.reject_unauthorized == false) {
    options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  axios(options)
  .then(async response => {

    if (response.status == 200) {

    let statsNew = {
      running: 0,
      queued: 0,
      created: 0,
      initiated: 0,
      pqueued: 0,
      error: 0,
      "lambda error": 0,
      failed: 0,
      completed: 0,
      queue_timeout : 0,
      idle_timeout : 0,
      stopped : 0,
      cancelled : 0,
      passed : 0,
      timeout : 0,
      inactive : 0,
    };
    let build_info = response.data;
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
        statsNew["pqueued"] == 0
    ) {
      if (
      statsNew["error"] +
        statsNew["lambda error"] +
        statsNew["failed"] +
        statsNew["completed"] +
        statsNew["queue_timeout"] +
        statsNew["idle_timeout"] +
        statsNew["stopped"] +
        statsNew["cancelled"] +
        statsNew["passed"] + 
        statsNew["timeout"] +
        statsNew["inactive"] == 0
      ) {
        get_build_info_count = get_build_info_count + 1;
        if (get_build_info_count > 4) {
          get_build_info_count = 0;
          update_status(false);
          return callback(null, response.data);
        }
        return setTimeout(callback, 5000, null);
      }
      update_status(false);
      return callback(null, response.data);
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
  })
  .catch(error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status == 401) {
        update_status(false);
        return callback("Unauthorized");
      } else {
        update_status(false);
        return callback("No response for build status");
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      
      update_status(false);
      console.log(error.cause);
      return callback("Error occured while checking build status");
    } else {
      update_status(false);
      console.log(error);
      return callback("Error occured while checking build status");
    }
    })

}

module.exports = {
  get_build_info: get_build_info,
  get_completed_build_info: get_completed_build_info,
};

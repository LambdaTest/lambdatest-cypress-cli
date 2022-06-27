const constants = require("../constants");
const request = require("request");
//https://api.cypress-v3.dev.lambdatest.io/api/v1/test/stop/?sessionId=4a7434b9-1905-4aaf-a178-9167acb00c5d
function stop_cypress_session(lt_config, session_id, env) {
  return new Promise(function (resolve, reject) {
    let options = {
      url: constants[env].BUILD_STOP_URL + session_id,
      headers: {
        Authorization: "Token " + lt_config["lambdatest_auth"]["access_key"],
        Username: lt_config["lambdatest_auth"]["username"],
      },
      method: "PUT",
    };
    if (lt_config.run_settings.reject_unauthorized == false) {
      options["rejectUnauthorized"] = false;
    }

    request.put(options, (err, res, body) => {
      if (err) {
        console.log("Error occured while stopping session", err);
        reject(err);
      }
      if (res.statusCode == "401") {
        console.log("Error Occured: Unauthorized access to session-stop");
        reject("Unauthorized");
      } else if (res.statusCode == "200") {
        console.log("Session stopped successfully");
        resolve(JSON.parse(body));
      } else {
        console.log(body);
        reject("No response for session stop");
      }
    });
  });
}

module.exports = {
  stop_cypress_session: stop_cypress_session,
};

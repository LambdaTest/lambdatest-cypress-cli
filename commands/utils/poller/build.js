const constants = require("../constants");
const request = require("request");
//https://api.cypress-v3.dev.lambdatest.io/api/v1/test/stop/?sessionId=4a7434b9-1905-4aaf-a178-9167acb00c5d
function stop_cypress_session(lt_config, session_id, env) {
  return new Promise(function (resolve, reject) {
    request(
      constants[env].BUILD_STOP_URL + session_id,
      {
        auth: {
          username: lt_config["lambdatest_auth"]["username"],
          password: lt_config["lambdatest_auth"]["access_key"],
        },
        method: "PUT",
      },
      (err, res, body) => {
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
      }
    );
  });
}

module.exports = {
  stop_cypress_session: stop_cypress_session,
};

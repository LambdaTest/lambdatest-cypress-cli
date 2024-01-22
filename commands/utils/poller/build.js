const constants = require("../constants");
const https = require('https');
const axios = require('axios');
//https://api.cypress-v3.dev.lambdatest.io/api/v1/test/stop/?sessionId=4a7434b9-1905-4aaf-a178-9167acb00c5d
function stop_cypress_session(lt_config, session_id, env) {
  return new Promise(function (resolve, reject) {
    let options = {
      url: constants[env].BUILD_STOP_URL + "?sessionId=" + session_id,
      headers: {
        Authorization: "Token " + lt_config["lambdatest_auth"]["access_key"],
        Username: lt_config["lambdatest_auth"]["username"],
      },
      method: "PUT",
    };
    if (lt_config.run_settings.reject_unauthorized == false) {
      options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }

    axios(options)
    .then(response => {
      console.log("Session stopped successfully");
      resolve(response.data);
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status == 401) {
          console.log("Error Occured: Unauthorized access to session-stop");
          reject("Unauthorized");
        } else {
          console.log("Error Occured: ",error.response.data);
          reject("No response for session stop");
        }
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log("Error occured while stopping session", error.cause);
        reject(error.cause);
      } else {
        console.log("Error occured while stopping session", error);
        reject(error);
      }
      })


  });
}

module.exports = {
  stop_cypress_session: stop_cypress_session,
};

const axios = require('axios');
const constants = require("./constants.js");
const { createHttpsAgent } = require("./proxy_agent.js");

function validate_cli(env = "prod", rejectUnauthorized) {
  console.log("Validating CLI");
  return new Promise(function (resolve, reject) {
    let requestUrl = constants[env].INTEGRATION_BASE_URL + constants.CLI;
    let options = {
      method: 'get',
      url: requestUrl,
      httpsAgent: createHttpsAgent(rejectUnauthorized !== false),
      proxy: false,
    };

    console.log("[DEBUG] Request URL:", requestUrl);
    console.log("[DEBUG] rejectUnauthorized:", rejectUnauthorized);
    console.log("[DEBUG] HTTP_PROXY:", process.env.HTTP_PROXY || process.env.http_proxy || "not set");
    console.log("[DEBUG] HTTPS_PROXY:", process.env.HTTPS_PROXY || process.env.https_proxy || "not set");
    console.log("[DEBUG] NO_PROXY:", process.env.NO_PROXY || process.env.no_proxy || "not set");

    axios(options)
    .then(response => {
      console.log("[DEBUG] Response status:", response.status);
      console.log("[DEBUG] Response headers:", JSON.stringify(response.headers));
      console.log("[DEBUG] Response body:", JSON.stringify(response.data));
      resolve(response.data);
    })
    .catch(error => {
    if (error.response) {
      console.log("[DEBUG] Error response status:", error.response.status);
      console.log("[DEBUG] Error response headers:", JSON.stringify(error.response.headers));
      console.log("[DEBUG] Error response data (first 500 chars):", String(error.response.data).substring(0, 500));
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status != 200 && error.response.status != 202) {
        console.log("Non 200 return while validating CLI");
        if (error.response.data) {
        reject(error.response.data);
        } else {
          reject(error.response);
        }
      } else {
        reject(error.response);
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log("[DEBUG] No response received. Error code:", error.code);
      console.log("[DEBUG] Error message:", error.message);
      console.log(error.cause);
      reject(error.cause);
    } else {
      console.log("[DEBUG] Request setup error:", error.message);
      console.log(error);
      reject(error);
    }
    })

  });
}

module.exports = {
  validate_cli: validate_cli,
};

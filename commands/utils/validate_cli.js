const https = require('https');
const axios = require('axios');
const constants = require("./constants.js");

function validate_cli(env = "prod", rejectUnauthorized) {
  console.log("Validating CLI");
  return new Promise(function (resolve, reject) {
    let options = {
      method: 'get',
      url: constants[env].INTEGRATION_BASE_URL + constants.CLI,
    };
    if (rejectUnauthorized == false) {
      options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
   
    axios(options)
    .then(response => {
      resolve(response.data);
    })
    .catch(error => {
    if (error.response) {
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
      console.log(error.cause);
      reject(error.cause);
    } else {
      console.log(error);
      reject(error);
    }
    })

  });
}

module.exports = {
  validate_cli: validate_cli,
};

const https = require('https');
const axios = require('axios');
const fs = require("fs");
const constants = require("./constants.js");
const { reject } = require('async');

function get_signed_url(lt_config, prefix, env = "prod") {
  console.log("Getting project upload url");
  return new Promise(function (resolve, reject) {
    let options = {
      method: 'post',
      url: constants[env].INTEGRATION_BASE_URL + constants.PROJECT_UPLOAD_URL,
      body: JSON.stringify({
        Username: lt_config["lambdatest_auth"]["username"],
        token: lt_config["lambdatest_auth"]["access_key"],
        prefix: prefix,
      }),
    };

    if (lt_config.run_settings.reject_unauthorized == false) {
      options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }

    axios(options)
    .then(response => {
      console.log("Got project upload url ");
      console.log(response);
      resolve(response.data);
    })
    .catch(error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status != 200 && error.response.status != 202) {
        if (error.response && error.response.data) {
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

function upload_zip(lt_config, file_name, prefix = "project", env = "prod") {
  return new Promise(function (resolve, reject) {
    const stats = fs.statSync(file_name);
    let fileSizeInBytes = stats.size;
    //Convert the file size to megabytes (optional)
    let fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
    if (fileSizeInMegabytes > 400) {
      reject("File Size exceeds 400 MB limit");
      return;
    }
    get_signed_url(lt_config, prefix, env)
      .then(function (responseDataURL) {
        console.log("Uploading the project " + responseDataURL);
        let options = {
          url: responseDataURL["value"]["message"],
          formData: {
            name: file_name,
            filename: file_name,
          },
          headers: {
            "Content-Type": "application/zip",
          },
        };
        options["formData"][file_name] = fs.readFileSync(file_name);

        if (lt_config.run_settings.reject_unauthorized == false) {
          options["rejectUnauthorized"] = false;
        }
        let responseData = null;
        request.put(options, function (err, resp, body) {
          if (err) {
            console.log("error occured while uploading project", err);
            reject(err);
          } else {
            if (resp.statusCode != 200) {
              if (resp && resp["error"]) {
                reject(resp["error"]);
              } else {
                console.log("Error occured in uploading", resp);
                reject("error", resp);
              }
            } else {
              console.log(`Uploaded ` + prefix + ` file successfully`);
              resolve(responseDataURL);
            }
          }
        });
      })
      .catch(function (err) {
        reject(err);
      });
  }).catch(function (err) {
    console.log("Failed to Upload", err);
  });
}

module.exports = {
  upload_zip: upload_zip,
};

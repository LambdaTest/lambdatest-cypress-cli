const fs = require("fs");
const request = require("request");
const constants = require("./constants.js");

function get_signed_url(lt_config, prefix, env = "prod") {
  console.log("Getting project upload url");
  return new Promise(function (resolve, reject) {
    let options = {
      url: constants[env].INTEGRATION_BASE_URL + constants.PROJECT_UPLOAD_URL,
      body: JSON.stringify({
        Username: lt_config["lambdatest_auth"]["username"],
        token: lt_config["lambdatest_auth"]["access_key"],
        prefix: prefix,
      }),
    };

    if (lt_config.run_settings.reject_unauthorized == false) {
      options["rejectUnauthorized"] = false;
    }
    let responseData = null;
    request.post(options, function (err, resp, body) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        try {
          responseData = JSON.parse(body);
        } catch (e) {
          console.log("Error in JSON response", body);
          responseData = null;
        }
        if (resp.statusCode != 200 && resp.statusCode != 202) {
          if (responseData && responseData["error"]) {
            reject(responseData["error"]);
          } else {
            reject(responseData);
          }
        } else {
          resolve(responseData);
        }
      }
    });
  });
}

function upload_zip(lt_config, file_name, prefix = "project", env = "prod") {
  return new Promise(function (resolve, reject) {
    const stats = fs.statSync(file_name);
    let fileSizeInBytes = stats.size;
    //Convert the file size to megabytes (optional)
    let fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
    if (fileSizeInMegabytes > 200) {
      reject("File Size exceed 200 MB limit");
      return;
    }
    get_signed_url(lt_config, prefix, env)
      .then(function (responseDataURL) {
        console.log("Uploading the project");
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

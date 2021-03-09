const fs = require('fs');
const { url } = require('inspector');
const request = require("request")
const constants = require("./constants.js")


function login(lt_config, env = "prod") {
    return new Promise(function (resolve, reject) {
        let options = {
            url: constants[env].INTEGRATION_BASE_URL + constants.LOGIN_URL,
            body: JSON.stringify({
                "Username": lt_config["lambdatest_auth"]["username"],
                "token": lt_config["lambdatest_auth"]["access_key"]
            }),
        }
        console.log("url %s", options["url"])
        let responseData = null;
        request.post(options, function (err, resp, body) {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                try {
                    responseData = JSON.parse(body);
                } catch (e) {
                    console.log("Error in JSON response", body)
                    responseData = null
                }
                if (resp.statusCode != 200 && resp.statusCode != 202) {
                    if (responseData && responseData["error"]) {
                        reject(responseData["error"]);
                    } else {
                        reject("error", responseData);
                    }
                } else {
                    resolve(responseData);
                }
            }
        });
    })
}

function upload_project(lt_config, file_name, env = "prod") {
    return new Promise(function (resolve, reject) {

        login(lt_config, env).then(function (responseDataLogin) {
            console.log("Login Status:-",responseDataLogin)
            let options = {
                url: constants[env].INTEGRATION_BASE_URL + constants.PROJECT_UPLOAD_URL,
                formData: {
                    "project.zip": fs.createReadStream(file_name),
                    filetype: 'zip',
                    filename: "project.zip",
                    Username: lt_config["lambdatest_auth"]["username"],
                    token: lt_config["lambdatest_auth"]["access_key"],
                },
                timeout:"600000"
            }

            let responseData = null;
            request.post(options, function (err, resp, body) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        responseData = JSON.parse(body);
                    } catch (e) {
                        console.log("Error in JSON response", body)
                        responseData = null
                    }
                    if (resp.statusCode != 200) {
                        if (responseData && responseData["error"]) {
                            reject(responseData["error"]);
                        } else {
                            reject("error", responseData);
                        }
                    } else {
                        console.log(`Uploaded tests successfully`);
                        resolve(responseData);
                    }
                }
            });
        }).catch(function (err) {
            reject("Not Authorized")
        })
    }).catch(function (err) {
        console.log("Not Authorized")
        // reject("Not Authorized")
    })
}



module.exports={
    upload_project:upload_project
}
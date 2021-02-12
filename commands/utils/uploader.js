const fs = require('fs');
const request = require("request")
const constants = require("./constants.js")


function login(lt_config, env = "prod") {
    return new Promise(function (resolve, reject) {
        console.log("login function", lt_config["lambdatest_auth"]["username"], lt_config["lambdatest_auth"]["access_key"])
        let options = {
            url: constants[env].INTEGRATION_BASE_URL + constants.LOGIN_URL,
            body: JSON.stringify({
                "Username": lt_config["lambdatest_auth"]["username"],
                "token": lt_config["lambdatest_auth"]["access_key"]
            }),
        }

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
                }
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
            console.log("rejected",err)
            reject("Not Authorized")
        })
    })
}


function upload_file(lt_config, file_name, env = "prod") {

    return new Promise(function (resolve, reject) {
        
        login(lt_config, env).then(function (responseDataLogin) {

            let options = {
                url: constants[env].INTEGRATION_BASE_URL + constants.RUN_URL,
                formData: {
                    "test.zip": fs.createReadStream(file_name),
                    filetype: 'zip',
                    filename: "test.zip",
                    Username: lt_config["lambdatest_auth"]["username"],
                    token: lt_config["lambdatest_auth"]["access_key"],
                }
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
                        console.log(`Uploaded tests successfully `);
                        //fileHelpers.deleteZip();
                        resolve(responseData);
                    }
                }
            });
        }).catch(function (responseDataLogin) {
            reject("Not Authorized", responseDataLogin)
        })
    })
};

module.exports={
    upload_file:upload_file,
    upload_project:upload_project
}
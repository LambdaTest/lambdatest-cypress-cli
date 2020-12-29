const fs = require('fs');
const AWS = require('aws-sdk');
const stream = require("stream");
const { sleep } = require('sleep');
const request = require("request")
const constants = require("./constants.js")
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

//const fileName = 'test.zip';
function login(lt_config) {
    return new Promise(function (resolve, reject) {

        console.log("login function", lt_config["lambdatest_auth"]["username"],lt_config["lambdatest_auth"]["access_key"])
        let options = {
            url: constants.INTEGRATION_BASE_URL + constants.LOGIN_URL,
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
                        console.log(responseData)
                        reject("error", responseData);
                    }
                } else {
                    resolve(responseData);
                }
            }
        });
    })
}
module.exports = uploadFile = function (lt_config, file_name) {

    return new Promise(function (resolve, reject) {
        login(lt_config).then(function () {
            resolve("Done")

            console.log("uploader function")
            let options = {
                url: constants.INTEGRATION_BASE_URL + constants.RUN_URL,
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
                            console.log(responseData)
                            reject("error", responseData);
                        }
                    } else {
                        console.log(`Uploaded tests successfully )`);
                        //fileHelpers.deleteZip();
                        resolve(responseData);
                    }
                }
            });
        }).catch(function(){
            reject("Not Authorized")
        })
    })
};


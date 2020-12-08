const fs = require('fs');
const AWS = require('aws-sdk');
const stream = require("stream");
const { sleep } = require('sleep');
const request = require("request")
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

//const fileName = 'test.zip';

module.exports = uploadFile =function(lt_config,file_name){
    return new Promise(function (resolve, reject) {
        resolve("Done")
        
        console.log("uploader function")
        let options = {
            url: "https://teopxx49w8.execute-api.us-east-1.amazonaws.com/dev/hit",
            formData: {
                file: fs.createReadStream(file_name),
                filetype: 'zip',
                filename: file_name,
                username: lt_config["lambdatest_auth"]["username"],
                access_key: lt_config["lambdatest_auth"]["access_key"],
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
                console.log(body)
                responseData = null
            }
            if (resp.statusCode != 200) {
                if (responseData && responseData["error"]) {
                reject(responseData["error"]);
                } else {
                    console.log(responseData)
                reject("error",responseData);
                }
            } else {
                console.log(`Uploaded tests successfully )`);
                //fileHelpers.deleteZip();
                resolve(responseData);
            }
            }
        });
        
        })
};


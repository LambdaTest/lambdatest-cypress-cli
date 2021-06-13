const request = require("request")
const constants = require("./constants.js")

function validate_cli(env = "prod") {
    return new Promise(function (resolve, reject) {
        let options = {
            url: constants[env].INTEGRATION_BASE_URL + constants.CLI,
            
        }
        let responseData = null;
        request.get(options, function (err, resp, body) {
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

module.exports={
    validate_cli:validate_cli
}

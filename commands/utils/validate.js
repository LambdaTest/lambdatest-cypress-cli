const fs = require("fs")
module.exports = validate_config = function (lt_config) {
    return new Promise(function (resolve, reject) {
        //validate auth keys are present
        if (!("lambdatest_auth" in lt_config) || !("username" in lt_config["lambdatest_auth"]) || !("access_key" in lt_config["lambdatest_auth"])) {
            reject("Error!!!  Incompatible Config Auth not present")
        }

        if (lt_config["lambdatest_auth"]["username"] == "<Your LambdaTest username>" || lt_config["lambdatest_auth"]["access_key"] == "<Your LambdaTest access key>") {
            reject("Error!!!  Auth details not correct")
        }
        //Validate spec file
        if (!("specs" in lt_config["run_settings"])) {
            reject("Error!! please provide specs key")
        } else if (lt_config["run_settings"]["specs"].length == 0) {
            reject("Error!! Please provide specs, specs list can not be empty")
        }
        //validate if browsers are not empty
        if (!("browsers" in lt_config)) {
            reject("Error!! please provide browsers")
        } else if (lt_config["browsers"].length == 0) {
            reject("Error!! please provide browsers, browsers list can not be empty")
        }
        //validate parellel session
        let parellels = lt_config["run_settings"]["parallels"]
        if (parellels == undefined || parellels == null || isNaN(parellels) || (Number(parellels) && Number(parellels) % 1 !== 0) || parseInt(parellels, 10) <= 0 || parellels === "Here goes the number of parallels you want to run") {
            reject("Error!! Parellels value not correct")
        }

        //validate if cypress config file is passed and exists
        if (lt_config["run_settings"]["cypress_config_file"] && lt_config["run_settings"]["cypress_config_file"] != "") {
            if (!fs.existsSync(lt_config["run_settings"]["cypress_config_file"])) {
                reject("Error!! Cypress Config File does not exists")
            }
        }
        resolve("Validated the Config")
    })
}
const request = require("request")
const constants = require("./utils/constants.js")
const process = require("process")


function generate_report(args) {

    return new Promise(function (resolve, reject) {
        var username = ""
        var access_key = ""
        //Check for username
        if ("user" in args) {
            username = args.user
        } else if (process.env.LT_USERNAME) {
            console.log("Setting Username from ENV", process.env.LT_USERNAME)
            username = process.env.LT_USERNAME
        } else {
            reject("Username not provided")
        }

        //Check for access key
        if ("access_key" in args) {
            access_key = args.access_key
        } else if (process.env.LT_ACCESS_KEY) {
            console.log("Setting Access Key from ENV", process.env.LT_ACCESS_KEY)
            access_key = process.env.LT_ACCESS_KEY
        } else {
            reject("Access Key not provided")
        }

        if (!("buildId" in args)) {
            reject("Please provide a build ID")
        }
        var env = "prod"
        if ("env" in args) {

            if (["stage", "prod", "beta"].includes(args["env"])) {
                env = args["env"]

            } else {
                console.log("Environment can be stage, beta or prod, setting Env to prod")

            }

        }
      
        const authorizationHeaderValue = Buffer.from(username + ':'+ access_key).toString('base64');
        let options = {
            url: constants[env].REPORT_GENERATE_URL,
            headers: {
                'Authorization': 'Basic ' + authorizationHeaderValue
            },
            body: JSON.stringify({
                "build_id": Number(args.buildId)
            }),
        }
        request.post(options , function(err, res, body) {
            if (err) {
                reject(err)
            }
            if (res.statusCode == "401") {
                resolve("Unauthorized")
            } else if(res.statusCode == 400){
                resolve("Bad request.Something went wrong on server side")
            }  else if (res.statusCode == 200) {
                resolve(JSON.stringify({'status': res.statusCode, 'message': body}))
            } else {
                resolve(JSON.parse(body).message)
            }
        });
    })
}

module.exports = function (args) {
    generate_report(args).then(function (resp) {
        console.log(resp)
    }
    ).catch(function (err) {
        console.log(err)
    })


};

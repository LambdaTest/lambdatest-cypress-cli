const constants = require("./constants.js")
const fs = require("fs")
const path = require('path')
const process = require("process")

function sync_args_from_cmd(args) {
    return new Promise(function (resolve, reject) {
        let rawdata = fs.readFileSync(args["lambdatest-config-file"]);
        let lt_config = JSON.parse(rawdata);

        if ("lambdatest_auth" in lt_config && "username" in lt_config["lambdatest_auth"] && lt_config["lambdatest_auth"]["username"] == "<Your LambdaTest username>") {
            if (process.env.LT_USERNAME) {
                console.log("Setting user name from environment", process.env.LT_USERNAME)
                lt_config['lambdatest_auth']['username'] = process.env.LT_USERNAME
            }

        } else if (process.env.LT_USERNAME && (!("lambdatest_auth" in lt_config) || !("username" in lt_config["lambdatest_auth"]))) {
            console.log("Setting user name from environment", process.env.LT_USERNAME)
            if (!lt_config['lambdatest_auth']) {
                lt_config['lambdatest_auth'] = {}
            }
            lt_config['lambdatest_auth']['username'] = process.env.LT_USERNAME
        }

        if ("lambdatest_auth" in lt_config && "access_key" in lt_config["lambdatest_auth"] && lt_config["lambdatest_auth"]["access_key"] == "<Your LambdaTest access key>") {
            if (process.env.LT_ACCESS_KEY) {
                console.log("setting access key from environment", process.env.LT_ACCESS_KEY)
                lt_config['lambdatest_auth']['access_key'] = process.env.LT_ACCESS_KEY
            }
        } else if (process.env.LT_ACCESS_KEY && (!("lambdatest_auth" in lt_config) || !("access_key" in lt_config["lambdatest_auth"]))) {
            if (!lt_config['lambdatest_auth']) {
                lt_config['lambdatest_auth'] = {}
            }
            console.log("Setting access key from environment", process.env.LT_ACCESS_KEY)
            lt_config['lambdatest_auth']['access_key'] = process.env.LT_ACCESS_KEY
        }

        if (!("browsers" in lt_config) || lt_config["browsers"].length == 0) {
            lt_config["browsers"] = []
            console.log("Testing on default browser")
            lt_config["browsers"].push({
                "browser": "Chrome",
                "platform": "Windows 10",
                "versions": [
                    "86.0"
                ]
            })
        }

        if (!("specs" in args) && "specs" in lt_config["run_settings"]) {
            lt_config["run_settings"]["specs"] = lt_config["run_settings"]["specs"].split(',')

        }
        else if ("specs" in args) {
            args['specs'] = args['specs'].split(',')
            lt_config["run_settings"]["specs"] = args["specs"]
        }

        if ("cypress-config-file" in args) {
            lt_config["run_settings"]["cypress_config_file"] = args["cypress-config-file"]
        }

        if ("env" in args) {
            env_vars = args["env"].split(",")
            envs = {}
            for (env in env_vars) {
                console.log(env_vars[env].split("="))
                envs[env_vars[env].split("=")[0]] = env_vars[env].split("=")[1]
            }
            if (fs.existsSync('cypress.env.json')) {
                let raw_env = fs.readFileSync('cypress.env.json');
                let env_json = JSON.parse(raw_env);
                envs = Object.assign(env_json, envs)
            }
            lt_config["run_settings"]["env"] = envs
        }

        if ("build-name" in args) {
            lt_config["run_settings"]["build_name"] = args["build-name"]
        }

        if ("tags" in args) {
            lt_config["run_settings"]["tags"] = args["tags"].split(",")
        }

        if ("parellels" in args) {
            lt_config["run_settings"]["parellels"] = args["parellels"]
        }
        //get specs from current directory if specs are not passed in config or cli
        if ((lt_config["run_settings"]["specs"] == undefined || lt_config["run_settings"]["specs"].length == 0) && fs.existsSync(constants.DEFAULT_TEST_PATH)) {
            args["specs"] = []
            console.log("Checking for specs in Current directory")
            read_files(constants.DEFAULT_TEST_PATH).then(function (files) {
                lt_config["run_settings"]["specs"] = files
                resolve(lt_config)
            })
        } else {
            resolve(lt_config)
        }

    })
}

function read_files(dir_path) {
    return new Promise(function (resolve, reject) {
        files = []
        const regex = new RegExp('^.*?\.spec\.js$');
        fs.readdirSync(dir_path).forEach(file => {
            if (regex.test(file)) {
                files.push(path.join(dir_path, file))
            } 
        });
        resolve(files)
    })
}

module.exports = {
    sync_args_from_cmd: sync_args_from_cmd
}
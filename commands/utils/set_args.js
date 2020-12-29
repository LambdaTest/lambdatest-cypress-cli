const fs = require("fs")
function sync_args_from_cmd(args) {
    return new Promise(function (resolve, reject) {
        let rawdata = fs.readFileSync(args["lambdatest-config-file"]);
        let lt_config = JSON.parse(rawdata);

        if (!("specs" in args)) {
            args["specs"] = lt_config["run_settings"]["specs"]
        }
        else {
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


        resolve(lt_config)
    })
}


module.exports = {
    sync_args_from_cmd: sync_args_from_cmd
}
const constants = require("./constants.js");
var init_commands = require("./../init.js");

const fs = require("fs");
const path = require("path");
const process = require("process");
const { type } = require("os");
const dotenv = require('dotenv')

function write_file(file_path, content) {
  fs.writeFileSync(file_path, content, function (err) {
    if (err) throw err;
    console.log("File Saved at ", file_path);
  });
}

function sync_args_from_cmd(args) {
  return new Promise(function (resolve, reject) {
    let rawdata = fs.readFileSync(args["lambdatest-config-file"]);
    let lt_config;
    try {
      lt_config = JSON.parse(rawdata);
    } catch (err) {
      reject("error in parsing lambdatest-config-file",err);
    }
    let usernameFromEnvFile = undefined;
    let accessKeyFromEnvFile = undefined;
    let envFile,parsedEnv;
    let dot_env_vars = undefined;
    let dot_env_keys_list = undefined;
    let envFilePath = path.join(".", `.env`);
    if ("sys-env-keys" in args) {
      dot_env_vars = args["sys-env-keys"];
    } else if (lt_config["run_settings"] && lt_config["run_settings"]["sys_env_keys"]) {
      dot_env_vars = lt_config["run_settings"]["sys_env_keys"];
    }
    if (dot_env_vars) {
      dot_env_vars = dot_env_vars.trim();
      dot_env_keys_list = dot_env_vars.split(",");
      if ("envfl" in args) {
        envFilePath = args["envfl"];
      } else if (lt_config["run_settings"] && lt_config["run_settings"]["env_file"]) {
        envFilePath = lt_config["run_settings"]["env_file"];
      }

      try {
        // check if envFilePath file exists
        if (fs.existsSync(envFilePath)) {
          console.log(`.env file found at ${envFilePath}`)
          envFile = fs.readFileSync(envFilePath, {encoding: 'utf8'})
          parsedEnv = dotenv.parse(envFile)
          for (index in dot_env_keys_list) {
            let envKey = dot_env_keys_list[index]
            if (envKey==constants.LT_USERNAME_ENV){
              let envValue = parsedEnv[envKey]
              if (envValue){
                usernameFromEnvFile = envValue
              } else {
                console.error(`value of username is not set in .env file.`)
              }
              
            } else if (envKey==constants.LT_ACCESS_KEY_ENV){
              let envValue = parsedEnv[envKey]
              if (envValue){
                accessKeyFromEnvFile = envValue
              } else {
                console.error(`value of access key is not set in .env file.`)
              }
            }
          }
        }
      } catch (err) {
        console.error("error in fetching environment variables from .env file",err);
      }
    }

    if (
      "lambdatest_auth" in lt_config &&
      "username" in lt_config["lambdatest_auth"] &&
      lt_config["lambdatest_auth"]["username"] == "<Your LambdaTest username>"
    ) {
      if (process.env.LT_USERNAME) {
        console.log(
          "Setting user name from environment",
          process.env.LT_USERNAME
        );
        lt_config["lambdatest_auth"]["username"] = process.env.LT_USERNAME;
      }
    } else if ( usernameFromEnvFile &&
      (!("lambdatest_auth" in lt_config) ||
        !("username" in lt_config["lambdatest_auth"]))) {
      console.log(
        "Setting user name from .env file",
        usernameFromEnvFile
      );
      if (!lt_config["lambdatest_auth"]) {
        lt_config["lambdatest_auth"] = {};
      }
      lt_config["lambdatest_auth"]["username"] = usernameFromEnvFile;
    } else if (
      process.env.LT_USERNAME &&
      (!("lambdatest_auth" in lt_config) ||
        !("username" in lt_config["lambdatest_auth"]))
    ) {
      console.log(
        "Setting user name from environment",
        process.env.LT_USERNAME
      );
      if (!lt_config["lambdatest_auth"]) {
        lt_config["lambdatest_auth"] = {};
      }
      lt_config["lambdatest_auth"]["username"] = process.env.LT_USERNAME;
    } else if ("username" in args && args["username"] != "") {
      if (!lt_config["lambdatest_auth"]) {
        lt_config["lambdatest_auth"] = {};
      }
      lt_config["lambdatest_auth"]["username"] = args["username"];
    }

    if (
      "lambdatest_auth" in lt_config &&
      "access_key" in lt_config["lambdatest_auth"] &&
      lt_config["lambdatest_auth"]["access_key"] ==
        "<Your LambdaTest access key>"
    ) {
      if (process.env.LT_ACCESS_KEY) {
        console.log("setting access key from environment");
        lt_config["lambdatest_auth"]["access_key"] = process.env.LT_ACCESS_KEY;
      }
    } else if (accessKeyFromEnvFile &&
      (!("lambdatest_auth" in lt_config) ||
        !("access_key" in lt_config["lambdatest_auth"]))) {
      if (!lt_config["lambdatest_auth"]) {
        lt_config["lambdatest_auth"] = {};
      }
      console.log("Setting access key from .env file");
      lt_config["lambdatest_auth"]["access_key"] = accessKeyFromEnvFile;
    } else if (
      process.env.LT_ACCESS_KEY &&
      (!("lambdatest_auth" in lt_config) ||
        !("access_key" in lt_config["lambdatest_auth"]))
    ) {
      if (!lt_config["lambdatest_auth"]) {
        lt_config["lambdatest_auth"] = {};
      }
      console.log("Setting access key from environment");
      lt_config["lambdatest_auth"]["access_key"] = process.env.LT_ACCESS_KEY;
    } else if ("access_key" in args && args["access_key"] != "") {
      if (!lt_config["lambdatest_auth"]) {
        lt_config["lambdatest_auth"] = {};
      }
      lt_config["lambdatest_auth"]["access_key"] = args["access_key"];
    }

    if (!("browsers" in lt_config) || lt_config["browsers"].length == 0) {
      lt_config["browsers"] = [];
      console.log("Testing on default browser");
      lt_config["browsers"].push({
        browser: "Chrome",
        platform: "Windows 10",
        versions: ["86.0"],
      });
    }

    if (!("specs" in args) && "specs" in lt_config["run_settings"]) {
      lt_config["run_settings"]["specs"] =
        lt_config["run_settings"]["specs"].split(",");
    } else if ("specs" in args) {
      args["specs"] = args["specs"].split(",");
      lt_config["run_settings"]["specs"] = args["specs"];
    }
    if ("cypress-config-file" in args) {
      lt_config["run_settings"]["cypress_config_file"] =
        args["cypress-config-file"];
    } else if (
      !lt_config["run_settings"]["cypress_config_file"] &&
      fs.existsSync(path.join(process.cwd(), "cypress.json"))
    ) {
      lt_config["run_settings"]["cypress_config_file"] = path.join(
        process.cwd(),
        "cypress.json"
      );
    }
    //Set the env variables
    let env_vars = undefined;
    if ("envs" in args) {
      env_vars = args["envs"].split(",");
    } else if (lt_config["run_settings"]["envs"]) {
      env_vars = lt_config["run_settings"]["envs"].split(",");
    }

    if (env_vars) {
      let envs = {};
      for (env in env_vars) {
        envs[env_vars[env].split("=")[0]] = env_vars[env].split("=")[1];
      }
      lt_config["run_settings"]["envs"] = envs;
    }
    if (
      "cypress-env-file" in args ||
      lt_config["run_settings"]["cypress-env-file"]
    ) {
      let env_json;
      let file_path;
      if ("cypress-env-file" in args) {
        file_path = args["cypress-env-file"];
      } else {
        file_path = lt_config["run_settings"]["cypress-env-file"];
      }
      if (fs.existsSync(file_path)) {
        let raw_env = fs.readFileSync(file_path);
        env_json = JSON.parse(raw_env);

        if (lt_config["run_settings"]["envs"]) {
          lt_config["run_settings"]["envs"] = Object.assign(
            lt_config["run_settings"]["envs"],
            env_json
          );
        } else {
          lt_config["run_settings"]["envs"] = env_json;
        }
      } else {
        reject("Cypress-env-file file not found but passed in command line");
      }
    }
    //set the build name on the basis of build identifier
    if ("build-name" in args) {
      lt_config["run_settings"]["build_name"] = args["build-name"];
    }
    if ("build-identifier" in args && lt_config["run_settings"]["build_name"]) {
      lt_config["run_settings"]["build_name"] =
        lt_config["run_settings"]["build_name"] + args["build-identifier"];
    } else if (
      "build-identifier" in args &&
      !lt_config["run_settings"]["build_name"]
    ) {
      lt_config["run_settings"]["build_name"] = args["build-identifier"];
    } else if (
      lt_config["run_settings"]["build_name"] &&
      lt_config["run_settings"]["build_identifier"]
    ) {
      lt_config["run_settings"]["build_name"] =
        lt_config["run_settings"]["build_name"] +
        lt_config["run_settings"]["build_identifier"];
    }

    if ("tags" in args) {
      lt_config["run_settings"]["tags"] = args["tags"].split(",");
    }

    if ("parallels" in args) {
      lt_config["run_settings"]["parallels"] = parseInt(args["parallels"]);
    } else if (!lt_config["run_settings"]["parallels"]) {
      lt_config["run_settings"]["parallels"] = 0;
    } else {
      lt_config["run_settings"]["parallels"] = parseInt(
        lt_config["run_settings"]["parallels"]
      );
    }

    //set tunnel options
    if ("tunnel" in args) {
      if (!("tunnel_settings" in lt_config)) {
        lt_config["tunnel_settings"] = {};
      }
      lt_config["tunnel_settings"]["tunnel"] = true
        ? args["tunnel"] == "true"
        : false;
    } else if (!("tunnel_settings" in lt_config)) {
      lt_config["tunnel_settings"] = {};
      lt_config["tunnel_settings"]["tunnel"] = false;
    } else if (!("tunnel" in lt_config["tunnel_settings"])) {
      lt_config["tunnel_settings"]["tunnel"] = false;
    }

    if ("tunnel_name" in args) {
      if (!("tunnel_settings" in lt_config)) {
        lt_config["tunnel_settings"] = {};
      }
      lt_config["tunnel_settings"]["tunnel_name"] = args["tunnel_name"];
    } else if (!("tunnel_settings" in lt_config)) {
      lt_config["tunnel_settings"] = {};
      lt_config["tunnel_settings"]["tunnel_name"] = "";
    } else if (!("tunnel_name" in lt_config["tunnel_settings"])) {
      lt_config["tunnel_settings"]["tunnel_name"] = "";
    }

    // to avoid passing tunnel name to upstream service if tunnel is false
    if  (lt_config["tunnel_settings"]["tunnel"]==false){
      lt_config["tunnel_settings"]["tunnel_name"]=null
    }


    //add browsers from cli
    if ("browsers" in args) {
      browsers = args["browsers"].split(",");
      browsers_formatted = [];
      for (browser in browsers) {
        browsers_formatted.push({
          platform: browsers[browser].split(":")[0],
          browser: browsers[browser].split(":")[1],
          versions: [browsers[browser].split(":")[2]],
        });
      }
      lt_config["browsers"] = browsers_formatted;
    }
    if (!lt_config["run_settings"]["ignore_files"]) {
      lt_config["run_settings"]["ignore_files"] = [];
    } else {
      lt_config["run_settings"]["ignore_files"] =
        lt_config["run_settings"]["ignore_files"].split(",");
    }
    if ("ignore_files" in args) {
      lt_config["run_settings"]["ignore_files"] =
        args["ignore_files"].split(",");
    }

    // if reporter_config_file parameter, add it in lt config alongwith a warning on console
    if (!lt_config["run_settings"]["reporter_config_file"]) {
      console.log(
        "Warning !! Value of reporter_config_file parameter missing. Proceeding with default reporter config"
      );
      // make sure that the default file exists on user system. If not, place it. There is a possibility that 
      // user may have deleted it from her system/or not ran init command.
      if (!fs.existsSync(lt_config["run_settings"]["reporter_config_file"])) {
        console.log("!! Warning, Creating the default reporter config file");
        init_commands.create_base_reporter_config_file(args);

      }
      lt_config["run_settings"]["reporter_config_file"] =
        constants.LT_BASE_REPORTER_CONFIG_FILE_NAME;
    }

    if ("cypress_version" in args) {
      lt_config["run_settings"]["cypress_version"] = args["cypress_version"];
    } else if (lt_config["run_settings"]["cypress_version"]) {
      lt_config["run_settings"]["cypress_version"] = String(
        lt_config["run_settings"]["cypress_version"]
      );
    }
    if ("sync" in args) {
      lt_config["run_settings"]["sync"] = true ? args["sync"] == "true" : false;
      if ("exit-on-failure" in args) {
        lt_config["run_settings"]["exit-on-failure"] = true;
      } else {
        lt_config["run_settings"]["exit-on-failure"] = false;
      }
    }

    if ("autostart" in args) {
      lt_config["tunnel_settings"]["autostart"] = true
        ? args["autostart"] == "true"
        : false;
    } else {
      lt_config["tunnel_settings"]["autostart"] = true;
    }

    if ("network" in args) {
      lt_config["run_settings"]["network"] = true
        ? args["network"] == "true"
        : false;
    } else if (!lt_config["run_settings"]["network"]) {
      lt_config["run_settings"]["network"] = false;
    }

    if ("network_http2" in args) {
      if (args["network_http2"] == "true") {
        lt_config.run_settings.network_http2 = true;
      } else {
        lt_config.run_settings.network_http2 = false;
      }
    } else if (lt_config["run_settings"]["network_http2"] && !lt_config["run_settings"]["network_http2"]) {
      lt_config["run_settings"]["network_http2"] = false;
    }

    if ("useNode18" in args) {
      if (args["useNode18"] == "true") {
        lt_config.run_settings.useNode18 = true;
      } else {
        lt_config.run_settings.useNode18 = false;
      }
    } else if (lt_config["run_settings"]["useNode18"] && !lt_config["run_settings"]["useNode18"]) {
      lt_config["run_settings"]["useNode18"] = false;
    }

    if ("accessibility" in args) {
      if (args["accessibility"] == "true") {
        lt_config.run_settings.accessibility = true;
      } else {
        lt_config.run_settings.accessibility = false;
      }
    } else if (lt_config["run_settings"]["accessibility"] && !lt_config["run_settings"]["accessibility"]) {
      lt_config["run_settings"]["accessibility"] = false;
    }

    if ("network_ws" in args) {
      if (args["network_ws"] == "true") {
        lt_config.run_settings.network_ws = true;
      } else {
        lt_config.run_settings.network_ws = false;
      }
    } else if (lt_config["run_settings"]["network_ws"] && !lt_config["run_settings"]["network_ws"]) {
      lt_config["run_settings"]["network_ws"] = false;
    }

    if ("network_sse" in args) {
      if (args["network_sse"] == "true") {
        lt_config.run_settings.network_sse = true;
      } else {
        lt_config.run_settings.network_sse = false;
      }
    } else if (lt_config["run_settings"]["network_sse"] && !lt_config["run_settings"]["network_sse"]) {
      lt_config["run_settings"]["network_sse"] = false;
    }

    if ("retry_failed" in args) {
      if (args["retry_failed"] == "true") {
        lt_config.run_settings.retry_failed = true;
      } else {
        lt_config.run_settings.retry_failed = false;
      }
    } else if (lt_config["run_settings"]["retry_failed"] && !lt_config["run_settings"]["retry_failed"]) {
      lt_config["run_settings"]["retry_failed"] = false;
    }

    if ("headless" in args) {
      lt_config["run_settings"]["headless"] = args["headless"];
    } else if (!lt_config["run_settings"]["headless"]) {
      lt_config["run_settings"]["headless"] = false;
    }

    //check for download folders
    if (!("downloads" in lt_config["run_settings"])) {
      lt_config["run_settings"]["downloads"] = "";
    }

    //Check for cypress settings
    if ("cypress_settings" in args) {
      lt_config["run_settings"]["cypress_settings"] = args["cypress_settings"];
    } else if (!lt_config["run_settings"]["cypress_settings"]) {
      lt_config["run_settings"]["cypress_settings"] = "";
    }

    //Check for geo location
    if ("geo_location" in args) {
      lt_config["run_settings"]["geo_location"] = args["geo_location"];
    } else if (!lt_config["run_settings"]["geo_location"]) {
      lt_config["run_settings"]["geo_location"] = "";
    }

    //Check for stop on failure location
    if ("stop_on_failure" in args) {
      lt_config["run_settings"]["stop_on_failure"] = true;
    } else if (!lt_config["run_settings"]["stop_on_failure"]) {
      lt_config["run_settings"]["stop_on_failure"] = false;
    }
    //Override project name for visual ui
    if ("vi-project" in args) {
      if (lt_config.run_settings.smart_ui != undefined) {
        lt_config.run_settings.smart_ui.project = args["vi-project"];
      } else {
        lt_config.run_settings.smart_ui = {};
        lt_config.run_settings.smart_ui.project = args["vi-project"];
      }
    }

    //Override build name for visual ui
    if ("vi-build" in args) {
      if (lt_config.run_settings.smart_ui != undefined) {
        lt_config.run_settings.smart_ui.build = args["vi-build"];
      } else {
        lt_config.run_settings.smart_ui = {};
        lt_config.run_settings.smart_ui.build = args["vi-build"];
      }
    }

    //Override baseline for visual ui
    if ("vi-base" in args) {
      if (lt_config.run_settings.smart_ui == undefined) {
        lt_config.run_settings.smart_ui = {};
      }
      if (args["vi-base"] == "true") {
        lt_config.run_settings.smart_ui.baseline = true;
      } else {
        lt_config.run_settings.smart_ui.baseline = false;
      }
    }

    if (
      lt_config.run_settings.project_name &&
      !lt_config.run_settings.project_key
    ) {
      lt_config.run_settings.project_key = lt_config.run_settings.project_name;
    }

    if (
      !lt_config.run_settings.project_name &&
      lt_config.run_settings.project_key
    ) {
      lt_config.run_settings.project_name = lt_config.run_settings.project_key;
    }

    if (lt_config.run_settings.project_autocreate == undefined) {
      lt_config.run_settings.project_autocreate = true;
    }

    //set build tags  from args
    if ("build-tags" in args) {
      lt_config["run_settings"]["build_tags"] = args["build-tags"].split(",");
    } else if (
      lt_config["run_settings"]["build_tags"] != undefined &&
      lt_config["run_settings"]["build_tags"] != ""
    ) {
      lt_config["run_settings"]["build_tags"] =
        lt_config["run_settings"]["build_tags"].split(",");
    }
    //set reject unauthorised  from args
    if ("reject_unauthorized" in args) {
      if (args["reject_unauthorized"] == "false") {
        lt_config["run_settings"]["reject_unauthorized"] = false;
      } else {
        lt_config["run_settings"]["reject_unauthorized"] = true;
      }
    } else {
      lt_config["run_settings"]["reject_unauthorized"] = false;
    }

    //Set the env variables
    let sys_env_vars = undefined;
    let envs = {};
    if ("sys-envs" in args) {
      sys_env_vars = args["sys-envs"];
    } else if (lt_config["run_settings"]["sys_envs"]) {
      sys_env_vars = lt_config["run_settings"]["sys_envs"];
    }

    if (sys_env_vars) {
      sys_env_vars = sys_env_vars.trim();
      sys_env_vars = sys_env_vars.split(";");

      for (index in sys_env_vars) {
        envItem = sys_env_vars[index];
        if (envItem) {
          envKeyValue = envItem.split("=");
          envKey = envKeyValue[0];
          envValue = envKeyValue[1];
          envs[envKey] = envValue;
        }
      }
    }
    if (dot_env_keys_list) { 
      try {
        for (index in dot_env_keys_list) {
          let envKey = dot_env_keys_list[index]
          if (parsedEnv && parsedEnv[envKey]) {
            let envValue = parsedEnv[envKey]
            envs[envKey] = envValue
            console.log(`Setting custom key ${envKey} from .env file`)
          } else if (process.env[envKey]){
            envs[envKey] = process.env[envKey]
            console.log(`Setting custom key ${envKey} from environment`)
          } else {
            console.error(`value of ${envKey} is not found in .env file or environment variable`)
          }
        }
      } catch (err) {
        console.error("error in fetching environment variables from .env file",err);
      }
    }

    lt_config["run_settings"]["sys_envs"] = envs;

    if ("exclude_specs" in lt_config["run_settings"]) {
      lt_config["run_settings"]["exclude_specs"] =
        lt_config["run_settings"]["exclude_specs"].split(",");
      console.log(
        "specs to exclude are",
        lt_config["run_settings"]["exclude_specs"]
      );
    } else {
      lt_config["run_settings"]["exclude_specs"] == [];
    }

    if ("fullHar" in args) {
      if (args["fullHar"] == "true") {
        lt_config.run_settings.fullHar = true;
      } else {
        lt_config.run_settings.fullHar = false;
      }
    }

    if ("npm-f" in args) {
      if (args["npm-f"] == "true") {
        lt_config.run_settings.npmf = true;
      } else {
        lt_config.run_settings.npmf = false;
      }
    }
    if ("npm-lpd" in args) {
      if (args["npm-lpd"] == "true") {
        lt_config.run_settings.npmlpd = true;
      } else {
        lt_config.run_settings.npmlpd = false;
      }
    }
    if ("res" in args) {
      console.log("resolution set to ", args.res);
      lt_config.run_settings.resolution = args.res;
    }
    //Set values for Dedicated proxy
    if ("dedicated_proxy" in args) {
      lt_config["run_settings"]["dedicated_proxy"] = true
        ? args["dedicated_proxy"] == "true"
        : false;
    } else if (!lt_config["run_settings"]["dedicated_proxy"]) {
      lt_config["run_settings"]["dedicated_proxy"] = false;
    }

    //Allow npm install via tunnel, to install private dependencies which are behind VPN
    if ("npm_via_tunnel" in args) {
      lt_config["run_settings"]["npm_via_tunnel"] = true
        ? args["npm_via_tunnel"] == "true"
        : false;
    } else if (!lt_config["run_settings"]["npm_via_tunnel"]) {
      lt_config["run_settings"]["npm_via_tunnel"] = false;
    }

    if ("max_duration" in args) {
      lt_config["run_settings"]["max_duration"] = parseFloat(args["max_duration"]);
    } else {
      lt_config["run_settings"]["max_duration"] = parseFloat(
        lt_config["run_settings"]["max_duration"]
      );
    }

    if ("cmd_log" in args) {
      if (args["cmd_log"] == "true") {
        lt_config["run_settings"]["command_log"] = true;
      } else {
        lt_config["run_settings"]["command_log"] = false;
      }
    }

    //get specs from current directory if specs are not passed in config or cli
    if (
      (lt_config["run_settings"]["specs"] == undefined ||
        lt_config["run_settings"]["specs"].length == 0) &&
      fs.existsSync(constants.DEFAULT_TEST_PATH)
    ) {
      args["specs"] = [];
      console.log("Checking for specs in Current directory");
      read_files(constants.DEFAULT_TEST_PATH).then(function (files) {
        lt_config["run_settings"]["specs"] = files;
        resolve(lt_config);
      });
    } else {
      resolve(lt_config);
    }
  });
}

function read_files(dir_path) {
  return new Promise(function (resolve, reject) {
    files = [];
    const regex = new RegExp("^.*?.spec.js$");
    fs.readdirSync(dir_path).forEach((file) => {
      if (regex.test(file)) {
        files.push(path.join(dir_path, file));
      }
    });
    resolve(files);
  });
}

module.exports = {
  sync_args_from_cmd: sync_args_from_cmd,
};

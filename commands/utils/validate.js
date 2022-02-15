const fs = require("fs");
const constants = require("./constants.js");
module.exports = validate_config = function (lt_config) {
  return new Promise(function (resolve, reject) {
    //validate auth keys are present
    if (
      !("lambdatest_auth" in lt_config) ||
      !("username" in lt_config["lambdatest_auth"]) ||
      !("access_key" in lt_config["lambdatest_auth"])
    ) {
      reject("Error!!!  Incompatible Config. Auth not present");
    }

    if (
      lt_config["lambdatest_auth"]["username"] ==
        "<Your LambdaTest username>" ||
      lt_config["lambdatest_auth"]["access_key"] ==
        "<Your LambdaTest access key>"
    ) {
      reject("Error!!!  Auth details not correct");
    }

    //Validate spec file
    if (!("specs" in lt_config["run_settings"])) {
      reject("Error!! please provide specs key");
    } else if (lt_config["run_settings"]["specs"].length == 0) {
      reject("Error!! Please provide specs, specs list can not be empty");
    }

    //validate if browsers are not empty
    if (!("browsers" in lt_config)) {
      reject("Error!! please provide browsers");
    } else if (lt_config["browsers"].length == 0) {
      reject("Error!! please provide browsers, browsers list can not be empty");
    }

    //validate parellel session
    let parallels = lt_config["run_settings"]["parallels"];
    if (
      parallels == undefined ||
      parallels == null ||
      isNaN(parallels) ||
      (Number(parallels) && Number(parallels) % 1 !== 0) ||
      parseInt(parallels, 10) <= 0 ||
      parallels === "Here goes the number of parallels you want to run"
    ) {
      reject("Error!! Parallels value not correct");
    }

    //validate if cypress config file is passed and exists
    if (
      lt_config["run_settings"]["cypress_config_file"] &&
      lt_config["run_settings"]["cypress_config_file"] != ""
    ) {
      if (!fs.existsSync(lt_config["run_settings"]["cypress_config_file"])) {
        reject("Error!! Cypress Config File does not exist");
      } else {
        let rawdata = fs.readFileSync(
          lt_config["run_settings"]["cypress_config_file"]
        );
        try {
          let cypress_config = JSON.parse(rawdata);
        } catch {
          console.log(
            "Cypress.json is not parsed, please provide a valid json"
          );
          reject("Error!! Cypress Config File does not has correct json");
        }
      }
    }

    //Validate if package.json is having the cypress dependency
    if (!fs.existsSync("package.json")) {
      reject(
        "Error!! Package.json file does not exist in the root on the project"
      );
    } else {
      let rawdata = fs.readFileSync("package.json");
      try {
        let package = JSON.parse(rawdata);
        //Override npm_dependencies
        if (lt_config.run_settings.npm_dependencies) {
          package.dependencies = lt_config.run_settings.npm_dependencies;
          package.devDependencies = {};
        }
        let cypress_flag = false;
        if (package.hasOwnProperty("dependencies")) {
          for (const [key, value] of Object.entries(package["dependencies"])) {
            if (key == "cypress") {
              cypress_flag = true;
              break;
            }
          }
        }
        if (
          cypress_flag == false &&
          package.hasOwnProperty("devDependencies")
        ) {
          for (const [key, value] of Object.entries(
            package["devDependencies"]
          )) {
            console.log(key, value);
            if (key == "cypress") {
              cypress_flag = true;
              break;
            }
          }
        }
        if (
          lt_config.run_settings.hasOwnProperty("cypress_version") &&
          lt_config.run_settings.cypress_version != ""
        ) {
          cypress_flag = true;
        } else if (
          lt_config.run_settings.hasOwnProperty("cypress_version") &&
          lt_config.run_settings.cypress_version == ""
        ) {
          cypress_flag = false;
          reject(
            "Error!! cypress_version can not be blank, either provide a value or remove the key"
          );
        }
        if (cypress_flag == false && lt_config.run_settings.npm_dependencies) {
          reject(
            "Error!!Cypress dependency is not present in npm_dependencies"
          );
        } else if (cypress_flag == false) {
          reject("Error!!Cypress dependency is not present in package.json");
        }
      } catch (e) {
        console.log(
          "Package.json is not parsed, please provide a valid json",
          e
        );
        reject("Error!! Package.json File does not has correct json");
      }
    }

    if (
      lt_config["run_settings"]["ignore_files"] &&
      lt_config["run_settings"]["ignore_files"].length > 0
    ) {
      for (
        var i = 0;
        i < lt_config["run_settings"]["ignore_files"].length;
        i++
      ) {
        if (lt_config["run_settings"]["ignore_files"][i] == "package.json") {
          reject(
            "package.json is added to ignore_files in run settings, Please remove package.json from ignore_files parameter in lambdatest-config.json file"
          );
          break;
        }
      }
    }
    //validate if network field contains expected value
    if ("network" in lt_config["run_settings"]) {
      if (![true, false].includes(lt_config["run_settings"]["network"])) {
        reject("Error!! boolean value is expected in network key");
      }
    }

    if (
      "downloads" in lt_config["run_settings"] &&
      lt_config["run_settings"]["downloads"] != ""
    ) {
      let download_folders = lt_config["run_settings"]["downloads"].split(",");
      for (folder in download_folders) {
        console.log(download_folders[folder]);
        if (download_folders[folder][0] != ".") {
          reject("Error!! dowloads folder path is not relative ", folder);
        }
      }
    }
    if ("smart_ui" in lt_config.run_settings) {
      if (!("project" in lt_config.run_settings.smart_ui)) {
        reject("Smart UI project name is missing");
      } else if (lt_config.run_settings.smart_ui.project == "") {
        reject("Smart UI porject name can not be blank");
      }
    }
    resolve("Validated the Config");
  });
};

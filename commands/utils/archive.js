const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const constants = require("./constants.js");
const process = require("process");
const semver = require("semver");

function delete_archive(file_name) {
  try {
    fs.unlinkSync(file_name);
  } catch (err) {
    console.error(err);
  }
}

function archive_project(lt_config) {
  return new Promise(function (resolve, reject) {
    const output = fs.createWriteStream("project.zip");
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    output.on("close", function () {
      resolve({ name: "project.zip" });
    });
    archive.on("progress", (progress) => {});
    output.on("end", function () {});

    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        // log warning
        console.log("WARN:", err);
        reject(err);
      } else {
        // throw error
        console.log("WARN:", err);
        reject(err);
      }
    });

    archive.on("error", function (err) {
      console.log("ERROR", err);
      reject(err);
      //throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);
    ignore_files = [
      "cypress.json",
      "node_modules",
      "node_modules/**/*",
      "test.zip",
      "project.zip",
      "mochawesome-report/**/*",
      "cypress/screenshots/**/*",
      "cypress/videos/**/*",
      "cypress/results/**/*",
      "lambdatest-artefacts/**/*",
      "*.lock",
      "package-lock.json",
    ].concat(lt_config["run_settings"]["ignore_files"]);
    //If we have some env variables passed through cli or config file we will ignore the original file and create a new one using
    //the parameter appended in config file through code
    if (lt_config["run_settings"]["envs"] != undefined) {
      ignore_files = [constants.CYPRESS_ENV_FILE_PATH].concat(ignore_files);
      archive.append(JSON.stringify(lt_config["run_settings"]["envs"]), {
        name: constants.CYPRESS_ENV_FILE_PATH,
        prefix: "project/",
      });
    }

    console.log("Ignoring files: ", ignore_files);
    archive.glob(
      "**/*",
      { cwd: process.cwd(), ignore: ignore_files, dot: false },
      { prefix: "project/" }
    );
    let raw_package_data = fs.readFileSync("package.json");
    let package = JSON.parse(raw_package_data);
    //OverRide NPM Dependencies
    if (
      lt_config.run_settings.npm_dependencies &&
      !lt_config.run_settings.cypress_version
    ) {
      console.log("Overriding NPM Dependencies");
      package.dependencies = lt_config.run_settings.npm_dependencies;
      package.devDependencies = {};
      package.dependencies.cypress = semver.coerce(
        package.dependencies.cypress
      ).version;
    } else if (
      lt_config.run_settings.npm_dependencies &&
      lt_config.run_settings.cypress_version
    ) {
      console.log("Overriding NPM Dependencies");
      package.dependencies = lt_config.run_settings.npm_dependencies;
      package.devDependencies = {};
      console.log("Overriding Cypress Version");
      package.dependencies.cypress = semver.coerce(
        lt_config.run_settings.cypress_version
      ).version;
    } else if (
      !lt_config.run_settings.npm_dependencies &&
      lt_config.run_settings.cypress_version
    ) {
      console.log("Overriding Cypress Version");
      if (
        package.hasOwnProperty("dependencies") &&
        package.dependencies.hasOwnProperty("cypress")
      ) {
        package.dependencies.cypress = semver.coerce(
          lt_config.run_settings.cypress_version
        ).version;
      } else {
        package.devDependencies.cypress = semver.coerce(
          lt_config.run_settings.cypress_version
        ).version;
      }
    } else {
      if (
        package.hasOwnProperty("dependencies") &&
        package.dependencies.hasOwnProperty("cypress")
      ) {
        package.dependencies.cypress = semver.coerce(
          package.dependencies.cypress
        ).version;
      } else {
        package.devDependencies.cypress = semver.coerce(
          package.devDependencies.cypress
        ).version;
      }
    }

    if (lt_config.run_settings.detailed_command_logs) {
      if (lt_config.run_settings.npm_dependencies && !lt_config.run_settings.npm_dependencies['cypress-terminal-report']) {
        reject("cypress-terminal-report is not installed in your project. Please add it in npm_dependencies of your lambdatest-config.json file and try again.");
      } else if (!package.dependencies['cypress-terminal-report'] && !package.devDependencies['cypress-terminal-report']) {
        reject("cypress-terminal-report is not installed in your project. Please add it in your package.json file and try again.");
      }
    }

    archive.append(
      JSON.stringify(package, null, 4),
      {
        name: "project/package.json",
        cwd: process.cwd(),
        ignore: ignore_files,
      },
      { prefix: "project/" }
    );
    if (fs.existsSync(".npmrc")) {
      let raw_data = fs.readFileSync(".npmrc", "utf8");
      if (
        lt_config.run_settings.dep_tokens &&
        lt_config.run_settings.dep_tokens.length > 0
      ) {
        let replace_map = {};
        for (let i = 0; i < lt_config.run_settings.dep_tokens.length; i++) {
          if (process.env[lt_config.run_settings.dep_tokens[i]]) {
            //Used for creating regular expression by escaping the $ and {}
            replace_map[
              "\\$\\{" + lt_config.run_settings.dep_tokens[i] + "\\}"
            ] = process.env[lt_config.run_settings.dep_tokens[i]];
            //User for String replacement
            replace_map["${" + lt_config.run_settings.dep_tokens[i] + "}"] =
              process.env[lt_config.run_settings.dep_tokens[i]];
          } else {
            reject("Dep Tokens are not in environment");
            return;
          }
        }
        var re = new RegExp(Object.keys(replace_map).join("|"), "gi");
        raw_data = raw_data.replace(re, function (matched) {
          return replace_map[matched];
        });
      }
      archive.append(
        raw_data,
        {
          name: "project/.npmrc",
          cwd: process.cwd(),
          ignore: ignore_files,
        },
        { prefix: "project/" }
      );
    } else if (
      lt_config.run_settings.dep_tokens &&
      lt_config.run_settings.dep_tokens.length > 0
    ) {
      reject("Dep Tokens are passed but .npmrc does not exist");
    }

    archive.finalize();
  });
}

function archive_batch(lt_config, batch) {
  return new Promise(function (resolve, reject) {
    const output = fs.createWriteStream("test.zip");
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    output.on("close", function () {
      resolve({ name: "test.zip" });
    });
    archive.on("progress", (progress) => {});
    output.on("end", function () {});

    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        // log warning
        console.log("WARN:", err);
        reject(err);
      } else {
        // throw error
        console.log("WARN:", err);
        reject(err);
      }
    });

    archive.on("error", function (err) {
      console.log("ERROR", err);
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    spec_files = [];
    for (i in batch) {
      spec_files.push(batch[i]["spec_file"]);
    }
    spec_files = Array.from(new Set(spec_files));
    for (i in spec_files) {
      console.log("Archiving --------- ", spec_files[i]);
      archive.file(spec_files[i], {
        name: "test/" + path.basename(spec_files[i]),
      });
    }
    if (
      lt_config["run_settings"]["cypress_config_file"] &&
      fs.existsSync(lt_config["run_settings"]["cypress_config_file"])
    ) {
      let rawdata = fs.readFileSync(
        lt_config["run_settings"]["cypress_config_file"]
      );
      archive.append(rawdata, { name: constants.CYPRESS_CONFIG_NAME });
    } else if (!lt_config["run_settings"]["cypress_config_file"]) {
      archive.append("{}", { name: constants.CYPRESS_CONFIG_NAME });
    }
    if (
      lt_config["run_settings"]["reporter_config_file"] &&
      lt_config["run_settings"]["reporter_config_file"] != ""
    ) {
      if (fs.existsSync(lt_config["run_settings"]["reporter_config_file"])) {
        let rawdata = fs.readFileSync(
          lt_config["run_settings"]["reporter_config_file"]
        );
        archive.append(rawdata, {
          name: path.basename(
            lt_config["run_settings"]["reporter_config_file"]
          ),
        });
      }
    }

    let lt_config_string = JSON.stringify(lt_config, null, 4);
    archive.append(lt_config_string, { name: constants.LT_CONFIG_NAME });
    archive.finalize();
  });
}

module.exports = {
  delete_archive: delete_archive,
  archive_project: archive_project,
  archive_batch: archive_batch,
};

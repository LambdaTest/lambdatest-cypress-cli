const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const constants = require("./constants.js");
const process = require("process");

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
      throw err;
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
      { cwd: process.cwd(), ignore: ignore_files },
      { prefix: "project/" }
    );

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
    if (lt_config["run_settings"]["reporter_config_file"]) {
      if (fs.existsSync(lt_config["run_settings"]["reporter_config_file"])) {
        let rawdata = fs.readFileSync(
          lt_config["run_settings"]["reporter_config_file"]
        );
        archive.append(rawdata, {
          name: path.basename(
            lt_config["run_settings"]["reporter_config_file"]
          ),
        });
      } else {
        reject(
          "Provided reporter config file not found. Please check the provided the value of reporter_config_file in lambdatest-config.json"
        );
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

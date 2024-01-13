const poller = require("./build_stats.js");
const async = require("async");
const build_stats = require("./build_stats.js");
const reports = require("../../../commands/generate_reports.js");
var build_result = true;

function poll_build(lt_config, session_id, env) {
  return new Promise(function (resolve, reject) {
    async.whilst(
      function test(callback) {
        callback(null, build_result);
      },
      function iter(callback) {
        poller.get_build_info(
          lt_config,
          session_id,
          env,
          update_status,
          callback
        );
      },
      function (err, result) {
        if (err == null) {
          build_stats
            .get_completed_build_info(lt_config, session_id, env)
            .then(async function (build_info) {
              if (!build_info || build_info.data == null) {
                console.log("Build info not found");
                resolve({exit_code:1, build_info:build_info});
                return;
              }
              let stats = {};
              let status = [];
              for (i = 0; i < build_info["data"].length; i++) {
                status.push({
                  Spec: build_info["data"][i]["name"],
                  Status: build_info["data"][i]["status_ind"],
                  Platform: build_info["data"][i]["platform"],
                  Browser: build_info["data"][i]["browser"],
                  Version: build_info["data"][i]["version"],
                });
                if (stats.hasOwnProperty(build_info["data"][i]["status_ind"])) {
                  stats[build_info["data"][i]["status_ind"]] += 1;
                } else [(stats[build_info["data"][i]["status_ind"]] = 1)];
              }
              console.table(status);
              console.log(stats);
              //Download the artefacts if downloads is passed
              if (lt_config.run_settings.downloads != "" && lt_config["run_settings"]["sync"] == true) {
                let args = {
                  user: lt_config.lambdatest_auth.username,
                  access_key: lt_config.lambdatest_auth.access_key,
                  session_id: session_id,
                  env: env,
                  reject_unauthorized:
                    lt_config.run_settings.reject_unauthorized,
                };

                await reports.generate_report(args)
              }
              if (
                Object.keys(stats).length == 1 &&
                (Object.keys(stats).includes("completed") ||
                  Object.keys(stats).includes("passed"))
              ) {
                resolve({exit_code:0, build_info:build_info});
              } else {
                resolve({exit_code:1, build_info:build_info});
              }
            })
            .catch(function (err) {
              console.log("Error", err);
            });
        } else {
          console.log(err);
          resolve({exit_code:1, build_info:null});
        }
      }
    );
  });
}

function update_status(status) {
  build_result = status;
}

module.exports = {
  poll_build: poll_build,
  update_status: update_status,
};

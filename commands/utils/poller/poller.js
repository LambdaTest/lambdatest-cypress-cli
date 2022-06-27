const poller = require("./build_stats.js");
const async = require("async");
const build_stats = require("./build_stats.js");
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
            .then(function (build_info) {
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
              if (
                Object.keys(stats).length == 1 &&
                (Object.keys(stats).includes("completed") ||
                  Object.keys(stats).includes("passed"))
              ) {
                resolve(0);
              } else {
                resolve(1);
              }
            })
            .catch(function (err) {
              console.log("Error", err);
            });
        } else {
          console.log(err);
          resolve(1);
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

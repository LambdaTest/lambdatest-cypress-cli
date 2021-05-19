const poller = require("./build_stats.js");
const async = require("async");
const build_stats = require("./build_stats.js");
var build_result = true;

function poll_build(lt_config, build_id, env) {
  return new Promise(function (resolve, reject) {
    async.whilst(
      function test(callback) {
        callback(null, build_result);
      },
      function iter(callback) {
        poller.get_build_info(
          lt_config,
          build_id,
          env,
          update_status,
          callback
        );
      },
      function (err, result) {
        if (err == null) {
          build_stats
            .get_completed_build_info(lt_config, build_id, env)
            .then(function (build_info) {
              stats = {};
              for (i = 0; i < build_info["data"].length; i++) {
                if (stats.hasOwnProperty(build_info["data"][i]["status_ind"])) {
                  stats[build_info["data"][i]["status_ind"]] += 1;
                } else [(stats[build_info["data"][i]["status_ind"]] = 1)];
              }
              console.log(stats);
              resolve();
            });
        } else {
          console.log(err);
          resolve();
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

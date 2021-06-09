const set_args = require("./utils/set_args.js");
const uploader = require("./utils/uploader.js");
const validate = require("./utils/validate");
const constants = require("./utils/constants.js");
const batcher = require("./utils/batch/batcher.js");
const validate_cli = require("./utils/validate_cli.js");
const fs = require("fs");
const batch_runner = require("./utils/batch/batch_runner.js");
var lambdaTunnel = require("@lambdatest/node-tunnel");
const { exec, execSync } = require("child_process");

module.exports = function (args) {
  let cli_version = execSync("lambdatest-cypress --version");
  cli_version = cli_version.toString().trim();
  if (!("lambdatest-config-file" in args)) {
    console.log("Checking Lambda Config in current directory");
    if (fs.existsSync(constants.LAMBDA_CONFIG)) {
      args["lambdatest-config-file"] = constants.LAMBDA_CONFIG;
    }
  }
  var env = "prod";
  if ("env" in args) {
    if (["stage", "prod", "beta"].includes(args["env"])) {
      env = args["env"];
    } else {
      console.log(
        "Environment can be stage, beta or prod, setting Env to prod"
      );
    }
  }
  validate_cli
    .validate_cli(env)
    .then(function (resp) {
      let cli_flag = false;
      for (let i = 0; i < resp["value"].length; i++) {
        if (resp.value[i].Version == cli_version) {
          cli_flag = true;
          break;
        }
      }
      if (cli_flag == false) {
        console.log(
          "Unsupported version detected!!!! Please upgrade your CLI to @latest"
        );
      } else {
        if ("lambdatest-config-file" in args) {
          //sync arguments between lt config and command line
          set_args
            .sync_args_from_cmd(args)
            .then(function (lt_config) {
              //validate the config options
              validate(lt_config)
                .then(function () {
                  batcher
                    .make_batches(lt_config)
                    .then(function (batches) {
                      if (
                        lt_config["tunnel_settings"]["tunnel"] &&
                        lt_config["tunnel_settings"]["autostart"]
                      ) {
                        var tunnelInstance = new lambdaTunnel();
                        var tunnelArguments = {
                          user: lt_config["lambdatest_auth"]["username"],
                          key: lt_config["lambdatest_auth"]["access_key"],
                          tunnelName:
                            lt_config["tunnel_settings"]["tunnelName"],
                          v: true,
                          env: env,
                        };

                        tunnelInstance
                          .start(tunnelArguments)
                          .then((status) => {
                            batch_runner
                              .run_batches(lt_config, batches, env)
                              .then(function () {
                                console.log("stopping tunnel");
                                tunnelInstance.stop();
                              })
                              .catch(function (error) {
                                console.log("stopping tunnel failed");
                                console.log(error);
                                tunnelInstance.stop();
                              });
                          })
                          .catch((error) => {
                            console.log(error);
                          });
                      } else {
                        batch_runner.run_batches(lt_config, batches, env);
                      }
                    })
                    .catch(function (err) {
                      console.log(err);
                    });
                })
                .catch(function (err) {
                  console.log(err);
                });
            })
            .catch(function (err) {
              console.log(err);
            });
        } else {
          console.log("Lambda Test config not present");
        }
      }
    })
    .catch(function (err) {
      console.log("error occured while getting cli version ", err);
    });
};

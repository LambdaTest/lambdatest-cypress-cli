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
    if (constants.ENVS.includes(args["env"])) {
      env = args["env"];
    } else {
      console.log(
        "Environment can be stage, beta, preprod or prod, setting Env to prod"
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
              validate(lt_config, resp)
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
                            lt_config["tunnel_settings"]["tunnel_name"],
                          v: true,
                          env: env,
                        };

                        tunnelInstance
                          .start(tunnelArguments)
                          .then((status) => {
                            batch_runner
                              .run_batches(lt_config, batches, env)
                              .then(function (exit_code) {
                                console.log("stopping tunnel");
                                tunnelInstance
                                  .stop()
                                  .then(function (done) {
                                    if (
                                      lt_config["run_settings"][
                                        "exit-on-failure"
                                      ]
                                    ) {
                                      process.exit(exit_code);
                                    }
                                  })
                                  .catch(function (error) {
                                    //At times Tunnel instance could not be stopped and
                                    //raised the error but this will stop tunnel automatically
                                    //after some time
                                    //Log error here for debugging
                                    console.log("");
                                    process.exit(exit_code);
                                  });
                              })
                              .catch(function (error) {
                                console.log(
                                  "Error occured while stopping tunnel"
                                );
                                console.log(error);
                              })
                              .catch(function (error) {
                                console.log("stopping tunnel failed");
                                console.log(error);
                                tunnelInstance.stop();
                              });
                          })
                          .catch((error) => {
                            console.log(
                              "Error occured while starting tunnel, check tunnel logs for more info on Error"
                            );
                          });
                      } else {
                        batch_runner
                          .run_batches(lt_config, batches, env)
                          .then(function (exit_code) {
                            if (lt_config["run_settings"]["exit-on-failure"]) {
                              process.exit(exit_code);
                            }
                          })
                          .catch(function (error) {
                            if (lt_config["run_settings"]["exit-on-failure"]) {
                              process.exit(1);
                            }
                          });
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

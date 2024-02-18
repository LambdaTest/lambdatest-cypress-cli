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
        "Environment can be stage,stage_new, beta, preprod or prod, setting Env to prod"
      );
      return;
    }
  }
  let rejectUnauthorized = true;
  if ("reject_unauthorized" in args) {
    if (
      args["reject_unauthorized"] != "false" &&
      args["reject_unauthorized"] != "true"
    ) {
      console.log("reject_unauthorized has to boolean");
      return;
    } else {
      if (args["reject_unauthorized"] == "false") {
        rejectUnauthorized = false;
        console.log("Setting rejectUnauthorized to false for web requests");
      } else {
        rejectUnauthorized = true;
      }
    }
  }
  validate_cli
    .validate_cli(env, rejectUnauthorized)
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
                .then(function (cypressVersion) {
                  /*
                  update ltconfig to contain the cypress_version
                  case 1: user passed cypress_version in run_settings, this case will work as earlier
                  case 2: user hasn't passed cypress_version in run_settting, then also we will pass it, so that we can track this parameter in further services
                  */


                  /* TEST scenarios:
                  - user passes cypress_version in run_settings with both cases- with semver/without semver
                  - user doesnot pass cypress_version in run_settings
                  */
                  
                  if (!("cypress_version" in lt_config.run_settings)){
                    lt_config.run_settings.cypress_version = cypressVersion;
                  }
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
                                    } else {
                                      process.exit(0);
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
                            } else {
                              process.exit(0);
                            }
                          })
                          .catch(function (error) {
                            if (lt_config["run_settings"]["exit-on-failure"]) {
                              process.exit(1);
                            } else {
                              process.exit(0);
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

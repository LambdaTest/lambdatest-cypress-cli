const set_args = require("./utils/set_args.js")
const uploader = require("./utils/uploader.js")
const validate = require("./utils/validate")
const constants = require("./utils/constants.js")
const batcher = require("./utils/batch/batcher.js")
const fs = require("fs")
const batch_runner = require("./utils/batch/batch_runner.js")
var lambdaTunnel = require('@lambdatest/node-tunnel');

module.exports = function (args) {
    if (!("lambdatest-config-file" in args)) {
        console.log("Checking Lambda Config in current directory")
        if (fs.existsSync(constants.LAMBDA_CONFIG)) {
            args["lambdatest-config-file"] = constants.LAMBDA_CONFIG
        }
    }
    var env = "prod"
    if ("env" in args) {

        if (["stage", "prod", "beta"].includes(args["env"])) {
            env = args["env"]

        } else {
            console.log("Environment can be stage, beta or prod, setting Env to prod")

        }

    }

    if ("lambdatest-config-file" in args) {
        //sync arguments between lt config and command line
        set_args.sync_args_from_cmd(args).then(function (lt_config) {
            //validate the config options
            validate(lt_config).then(function () {
                batcher.make_batches(lt_config).then(function (batches) {
                    if (lt_config["tunnel_settings"]["tunnel"]) {
                        var tunnelInstance = new lambdaTunnel();
                        var tunnelArguments = {
                            user: lt_config["lambdatest_auth"]["username"],
                            key: lt_config["lambdatest_auth"]["access_key"],
                            tunnelName: lt_config["tunnel_settings"]["tunnelName"],
                            v: true,
                            env: env
                        };

                        tunnelInstance
                            .start(tunnelArguments)
                            .then(status => {
                                console.log("CALLING run_batches")
                                batch_runner.run_batches(lt_config, batches, env).then(function () {
                                    console.log("stopping tunnel")
                                    tunnelInstance.stop()
                                }).catch(function (error) {
                                    console.log("stopping tunnel failed")
                                    console.log(error)
                                    tunnelInstance.stop()
                                })
                                console.log("no exception caught in then function of run batches")
                            }).catch(error => {
                                console.log("run batches failed")
                                console.log(error);
                            });
                    } else {
                        batch_runner.run_batches(lt_config, batches, env)
                    }
                }).catch(function (err) {
                    console.log(err)
                })

            }).catch(function (err) {
                console.log(err)
            })
        }).catch(function (err) {
            console.log(err)
        })
    }
    else {
        console.log("Lambda Test config not present")
    }

};

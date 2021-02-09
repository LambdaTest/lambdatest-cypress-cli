const archive = require("./utils/archive.js");
const set_args = require("./utils/set_args.js")
const uploader = require("./utils/uploader.js")
const validate = require("./utils/validate")
const constants = require("./utils/constants.js")
const fs = require("fs")

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
                //archive the files(config, spec)
                archive.archive_files(lt_config).then(function (file_obj) {
                    file_name = file_obj["name"]
                    count = file_obj["count"]
                    if (count < 2) {
                        console.log("Spec not passed")
                        return
                    }
                    console.log("file archived", file_name)
                    //upload files to Lambdatest
                    uploader(lt_config, file_name, env).then(function (response) {
                        console.log("Uploaded", response)
                        //Synchronously delete the created Zip after Upload
                        archive.delete_archive(file_name)
                    }).catch(function (error) {
                        console.log(error)
                        archive.delete_archive(file_name)
                    })
                })
            }).catch(function (msg) {
                console.log(msg)
            })
        }).catch(function (err) {
            console.log(err)
        })
    }
    else {
        console.log("Lambda Test config not present")
    }

};

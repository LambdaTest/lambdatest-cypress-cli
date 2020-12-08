const archive = require("./utils/archive.js");
const set_args = require("./utils/set_args.js")
const uploader = require("./utils/uploader.js")
const validate = require("./utils/validate")

module.exports = function (args) {
    console.log("inside run function")

    if ("lambdatest-config-file" in args) {
        //sync arguments between lt config and command line
        set_args.sync_args_from_cmd(args).then(function (lt_config) {
            //validate the config options
            validate(lt_config).then(function () {
                //archive the files(config, spec)
                archive(lt_config).then(function (file_name) {
                    console.log("file archived",file_name)
                    //upload files to Lambdatest
                    uploader(lt_config,file_name).then(function (response) {
                        console.log("Uploaded", response)
                    }).catch(function (error) {
                        console.log(error)
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
        set_args.set_args_from_cmd(args)
    }
    /*archive(args).then(function(){
        console.log("promise returned")
    })
    */
};

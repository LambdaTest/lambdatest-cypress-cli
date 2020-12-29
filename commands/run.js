const archive = require("./utils/archive.js");
const set_args = require("./utils/set_args.js")
const uploader = require("./utils/uploader.js")
const validate = require("./utils/validate")

module.exports = function (args) {
    if ("lambdatest-config-file" in args) {
        //sync arguments between lt config and command line
        set_args.sync_args_from_cmd(args).then(function (lt_config) {
            //validate the config options
            validate(lt_config).then(function () {
                //archive the files(config, spec)
                archive.archive_files(lt_config).then(function (file_name) {
                    console.log("file archived", file_name)
                    //upload files to Lambdatest
                    uploader(lt_config, file_name).then(function (response) {
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
        set_args.set_args_from_cmd(args)
    }
    /*archive(args).then(function(){
        console.log("promise returned")
    })
    */
};

var fs = require('fs');
var path = require('path');
const { exit } = require('process');
const { config } = require('yargs');
const constants = require('./utils/constants.js')

function create_file(file_path, content) {
    fs.writeFileSync(file_path, content, function (err) {
        if (err) throw err;
        console.log('Saved at ',file_path);
    });
};

function create_ltconfig_file(args) {
    let cv=9.6
    if("cv" in args){
        cv=args["cv"]
    }
    let config =parseInt(cv)>=10?require('./utils/default_config_10.js'):require('./utils/default_config_9.js')
    config.run_settings.npm_dependencies.cypress=cv.toString()
    let content = JSON.stringify(config, null, 3);
    if ("config-file-name" in args && args["config-file-name"] !=""){
        //check if file or directory exists
        if (fs.existsSync(args["config-file-name"])) {
            let stats = fs.statSync(args["config-file-name"]);
            if (stats.isFile()) {
                create_file(args["config-file-name"], content)
            }
            else {
                create_file(path.join(args["config-file-name"], constants.LT_CONFIG_NAME), content)
            }
        }
        else {
            filename = path.basename(args["config-file-name"])
            var re = new RegExp(".+\\..+");
            if (re.test(filename)) {
                fs.mkdirSync(path.dirname(args["config-file-name"]), { recursive: true });
                create_file(args["config-file-name"], content)
            }else {
                fs.mkdirSync(args["config-file-name"], { recursive: true });
                create_file(path.join(args["config-file-name"], constants.LT_CONFIG_NAME), content)
            }
        }
    }else{
        console.log("Picking the default config file name ",constants.LT_CONFIG_NAME)
        create_file(constants.LT_CONFIG_NAME, content)
    }
};

function create_custom_support_file(args){
    const pathToFile = path.join(__dirname, "default_custom_support_file.js");
    const pathToNewDestination = constants.LT_BASE_CUSTOM_SUPPORT_FILE_NAME;
    fs.copyFile(pathToFile, pathToNewDestination, (err) => {
        if (err) {
          console.log("Error while copying custom support file", err);
        }
        else {
            console.log("Saved at ", pathToNewDestination);
        }
      });
}

function create_base_reporter_config_file(args) {
    let config = require('./utils/default_reporter_config.js')
    let content = JSON.stringify(config, null, 3);

    if (args._.length == 1) {
        create_file(constants.LT_BASE_REPORTER_CONFIG_FILE_NAME, content)
    }
};

function init_implementation(args){
    create_ltconfig_file(args);
    create_base_reporter_config_file(args);
    if ("cv" in args){
        if (parseInt(args["cv"])>=10){
            create_custom_support_file(args);
        }
    }
};
module.exports = {
    create_base_reporter_config_file:create_base_reporter_config_file,
    init_implementation:init_implementation,
};

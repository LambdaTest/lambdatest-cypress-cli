var fs = require('fs');
var path = require('path');
const { exit } = require('process');
const { config } = require('yargs');
const constants = require('./utils/constants.js')

function create_file(file_path, content) {
    fs.writeFile(file_path, content, function (err) {
        if (err) throw err;
        console.log('Saved at ',file_path);
    });
}

function create_ltconfig_file(args) {
    let config = require('./utils/default_config.js')
    let content = JSON.stringify(config, null, 3);
    if (args._.length == 1) {
        create_file(constants.LT_CONFIG_NAME, content)
    }
    else if (args._.length > 1) {
        //check if file or directory exists
        if (fs.existsSync(args._[1])) {
            let stats = fs.statSync(args._[1]);
            if (stats.isFile()) {
                make_file(args._[1], content)
            }
            else {
                create_file(path.join(args._[1], constants.LT_CONFIG_NAME), content)
            }
        }
        else {
            filename = path.basename(args._[1])
            var re = new RegExp(".+\\..+");
            if (re.test(filename)) {
                fs.mkdirSync(path.dirname(args._[1]), { recursive: true });
                create_file(args._[1], content)
            }
            else {
                fs.mkdirSync(args._[1], { recursive: true });
                create_file(path.join(args._[1], constants.LT_CONFIG_NAME), content)
            }
        }
    }
};

function create_base_reporter_config_file(args) {
    let config = require('./utils/default_reporter_config.js')
    let content = JSON.stringify(config, null, 3);
    if (args._.length == 1) {
        create_file(constants.LT_BASE_REPORTER_CONFIG_FILE_NAME, content)
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
            console.log("Successfully saved custom support file at - ", pathToNewDestination);
        }
      });
}

module.exports = function (args) {
    create_ltconfig_file(args);
    create_base_reporter_config_file(args);
    create_custom_support_file(args);
};

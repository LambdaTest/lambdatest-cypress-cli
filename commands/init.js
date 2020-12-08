var fs = require('fs');
var path = require('path')
const { config } = require('yargs');

function make_file(file_path,content){
    fs.writeFile(file_path, content, function (err) {
        if (err) throw err;
        console.log('Saved at ',file_path);
    });
}

function create_file(args) {
    let config = require('./utils/default_config.js')
    let content = JSON.stringify(config, null, 3);
    if (args._.length == 1) {
        console.log("No path passed")
        make_file("lambdatest-config.json",content)
    }
    else if (args._.length > 1) {
        //check if file or directory exists
        if (fs.existsSync(args._[1])) {
            let stats = fs.statSync(args._[1]);
            if (stats.isFile()) {
                make_file(args._[1], content)
            }
            else{
                /*fs.writeFile(path.join(args._[1],"lambdatest-config.json"), content, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                });*/
                make_file(path.join(args._[1],"lambdatest-config.json"), content)
            }
        }
        else {
            console.log("directory/file does not exixt",args._[1])
            filename=path.basename(args._[1])
            //console.log(filename)
            var re = new RegExp(".+\\..+");
            //console.log(re.test(filename))
            if(re.test(filename)){
                console.log("filename passed by user",filename)
                fs.mkdirSync(path.dirname(args._[1]), { recursive: true });
                make_file(args._[1], content)
                /*fs.writeFile(args._[1], content, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                });*/
            }
            else{
                console.log("directory passed by user",path.dirname(args._[1]))
                fs.mkdirSync(args._[1], { recursive: true });
                make_file(path.join(args._[1],"lambdatest-config.json"),content)
                /*fs.writeFile(path.join(args._[1],"lambdatest-config.json"), content, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                });*/
            }
            console.log(path.dirname(args._[1]))
            //fs.mkdirSync(args._[1], { recursive: true });
        }



    }

    /*
    //get default config content
    let config=require('./default_config.js')
    let content = JSON.stringify(config,null,3);
    

    fs.writeFile('/Users/japneet/Desktop/abc/config.json', content, function (err) {
        if (err) throw err;
        console.log('Saved!');
    });*/
};

module.exports = function (args) {
    //create_file(args.path)
    console.log("inside init function")
    console.log(args._)
    create_file(args)

};

//create_file("sss")
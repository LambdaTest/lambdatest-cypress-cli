const fs= require("fs")
function sync_args_from_cmd(args){
    return new Promise(function(resolve,reject){
        console.log("setting arguments from file",args,!("specs" in args))
        let rawdata = fs.readFileSync(args["lambdatest-config-file"]);
        let lt_config = JSON.parse(rawdata);
        
        if(!("specs" in args)){
            args["specs"]=lt_config["run_settings"]["specs"]
        }
        else{
            args['specs']=args['specs'].split(',')
            lt_config["run_settings"]["specs"]= args["specs"]
        }

        if("cypress-config-file" in args){
            lt_config["run_settings"]["cypress_config_file"]=args["cypress-config-file"]
        }

        if("env" in args){
            lt_config["run_settings"]["env"]=args["env"]
        }

        if("build-name" in args){
            lt_config["run_settings"]["build_name"]=args["build-name"]
        }

        if("tags" in args){
            lt_config["run_settings"]["tags"]=args["tags"]
        }

        if("parellels" in args){
            lt_config["run_settings"]["parellels"]=args["parellels"]
        }


        resolve(lt_config)
    })
}


module.exports={
    sync_args_from_cmd:sync_args_from_cmd
}
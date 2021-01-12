const request = require("request")
const constants = require("./utils/constants.js")


function get_build_info(args) {
    constants.BUILD_BASE_URL
    return new Promise(function (resolve, reject) {
        request(constants.BUILD_BASE_URL + args.buildId, { auth:{ username: args.user,
            password: args.pass} }, (err, res, body) => {
            if (err) { reject("err") }
            resolve(JSON.parse(body).data)
          });

        

       
    })
    
}

module.exports = function (args) {
    get_build_info(args).then(function(resp){
        console.log(resp)
    }
    ).catch(function(err){
        console.log(err)
    })


};

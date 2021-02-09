const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const constants= require('./constants.js')

function delete_archive(file_name) {
        try {
            fs.unlinkSync(file_name)
            console.log("file removed")
        } catch (err) {
            console.error(err)
        }

}
function archive_files(lt_config) {
    var count=0
    return new Promise(function (resolve, reject) {     
        if (!'specs' in lt_config) {
            throw "Specs not found"
        }

        files = lt_config['run_settings']['specs']
        const output = fs.createWriteStream('test.zip');
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            resolve({name:"test.zip",count:count})
        });
        archive.on("progress", (progress) => {
           count++
        })
        output.on('end', function () {
            console.log('Data has been drained');
        });
        
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
                console.log("WARN:",err)
            } else {
                // throw error
                console.log("WARN:",err)
                throw err;
            }
        });

        archive.on('error', function (err) {
            console.log("ERROR",err)
            throw err;
        });

        // pipe archive data to the file
        archive.pipe(output);

        for (const property in files) {

            console.log("archiving file...", path.basename(files[property]))
            archive.glob(path.basename(files[property]), { cwd: path.dirname(files[property]), matchBase: true, dot: true }, { prefix: "test/" });

        }

        let lt_config_string = JSON.stringify(lt_config, null, 4);
        archive.append(lt_config_string, { name: constants.LT_CONFIG_NAME });


        if(lt_config["run_settings"]["cypress_config_file"] && fs.existsSync( lt_config["run_settings"]["cypress_config_file"] )){
            let rawdata = fs.readFileSync(lt_config["run_settings"]["cypress_config_file"]);
            archive.append(rawdata, { name: constants.CYPRESS_CONFIG_NAME });
            count--
        }
        archive.finalize();



    })
};

module.exports = {
    archive_files: archive_files,
    delete_archive: delete_archive
}
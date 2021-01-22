const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const constants= require('./constants.js')
const { SSL_OP_EPHEMERAL_RSA } = require('constants');

function delete_archive(file_name) {
        try {
            fs.unlinkSync(file_name)
            console.log("file removed")
        } catch (err) {
            console.error(err)
        }

}
function archive_files(lt_config) {
    return new Promise(function (resolve, reject) {     
        if (!'specs' in lt_config) {
            throw "Specs not found"
        }

        const output = fs.createWriteStream('test.zip');
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            resolve("test.zip")
        });

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



        files = lt_config['run_settings']['specs']
        for (const property in files) {

            console.log("archiving file...", path.basename(files[property]))
            archive.glob(path.basename(files[property]), { cwd: path.dirname(files[property]), matchBase: true, dot: true }, { prefix: "test/" });

        }

        let lt_config_string = JSON.stringify(lt_config, null, 4);
        archive.append(lt_config_string, { name: constants.LT_CONFIG_NAME });

        let cypressFolderPath = path.dirname(lt_config['run_settings']['cypress_config_file']);
        lt_config["run_settings"]["cypress_config_file"]
        archive.glob(path.basename(lt_config["run_settings"]["cypress_config_file"]), { cwd: path.dirname(lt_config["run_settings"]["cypress_config_file"]) })


        archive.finalize();



    })
};

module.exports = {
    archive_files: archive_files,
    delete_archive: delete_archive
}
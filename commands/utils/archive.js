const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const constants = require('./constants.js')
const process = require("process")


function delete_archive(file_name) {
    try {
        fs.unlinkSync(file_name)
        console.log("%s File Deleted", file_name)
    } catch (err) {
        console.error(err)
    }

}

function archive_project(ignore_files = []) {
    return new Promise(function (resolve, reject) {
        const output = fs.createWriteStream('project.zip');
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });
        output.on('close', function () {
            resolve({ name: "project.zip" })
        });
        archive.on("progress", (progress) => {
        })
        output.on('end', function () {

        });

        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
                console.log("WARN:", err)
                reject(err)
            } else {
                // throw error
                console.log("WARN:", err)
                reject(err)
            }
        });

        archive.on('error', function (err) {
            console.log("ERROR", err)
            throw err;
        });

        // pipe archive data to the file
        archive.pipe(output);
        ignore_files = ['node_modules', 'node_modules/**/*', 'test.zip', 'project.zip', 'mochawesome-report', 'cypress/screenshots', 'cypress/videos', 'cypress/results'].concat(ignore_files)
        console.log("Ignoring files: ", ignore_files)
        archive.glob('**/*', { cwd: process.cwd(), ignore: ignore_files })

        archive.finalize();
    })

}


function archive_batch(lt_config, batch) {

    return new Promise(function (resolve, reject) {
        const output = fs.createWriteStream('test.zip');
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });
        output.on('close', function () {
            resolve({ name: "test.zip" })
        });
        archive.on("progress", (progress) => {
        })
        output.on('end', function () {

        });

        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
                console.log("WARN:", err)
                reject(err)
            } else {
                // throw error
                console.log("WARN:", err)
                reject(err)
            }
        });

        archive.on('error', function (err) {
            console.log("ERROR", err)
            throw err;
        });

        // pipe archive data to the file
        archive.pipe(output);

        spec_files = []
        for (i in batch) {
            spec_files.push(batch[i]["spec_file"])
        }
        spec_files = Array.from(new Set(spec_files))
        for (i in spec_files) {
            console.log("Archiving --------- ", spec_files[i])
            archive.file(spec_files[i], { name: "test/" + path.basename(spec_files[i]) });
        }
        if (lt_config["run_settings"]["cypress_config_file"] && fs.existsSync(lt_config["run_settings"]["cypress_config_file"])) {
            let rawdata = fs.readFileSync(lt_config["run_settings"]["cypress_config_file"]);
            archive.append(rawdata, { name: constants.CYPRESS_CONFIG_NAME });

        }

        let lt_config_string = JSON.stringify(lt_config, null, 4);
        archive.append(lt_config_string, { name: constants.LT_CONFIG_NAME });
        archive.finalize();
    })
}

module.exports={
delete_archive:delete_archive,
archive_project:archive_project,
archive_batch:archive_batch
}
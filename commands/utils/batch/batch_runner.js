const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const constants = require('../constants.js')
const uploader = require("../uploader.js")

function delete_archive(file_name) {
    try {
        fs.unlinkSync(file_name)
        console.log("File Deleted")
    } catch (err) {
        console.error(err)
    }

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
            console.log('Data has been drained');
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
            console.log("Archiving--------- ", spec_files[i])
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


async function run(lt_config, batches, env, i = 0) {
    return new Promise(async function (resolve, reject) {
        for (i in batches) {
            lt_config["test_suite"] = batches[i]
            await archive_batch(lt_config, batches[i]).then(async function (file_obj) {
                console.log("Archived")
                await uploader(lt_config, file_obj["name"], env).then(function (resp) {
                    console.log(resp)
                    delete_archive(file_obj['name'])
                }).catch(function (err) {
                    console.log(err)
                    delete_archive(file_obj["name"])
                })
            })

        }
    })

}


module.exports = {
    run_batches: run
}
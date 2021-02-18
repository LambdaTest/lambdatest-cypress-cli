const glob = require('glob')
const fs = require('fs')
const path = require('path')

function get_required_sessions(browsers) {
    let combinations = []
    for (b in browsers) {
        for (v in browsers[b]["versions"]) {
            combinations.push({
                "browser": browsers[b]["browser"],
                "platform": browsers[b]["platform"],
                "version": browsers[b]["versions"][v]

            })
        }
    }
    return combinations

}
function get_spec_files(files) {
    return new Promise(function (resolve, reject) {
        let matched_files = []
        for (i in files) {
            matched_files = matched_files.concat(glob.sync(files[i]))
        }
        if (matched_files.length == 0) {
            reject("Spec files are not present")
        }
        for (i in matched_files) {
            if (!fs.existsSync(matched_files[i])) {
                reject("Spec files are not present")
            }
        }
        resolve(matched_files)
    })
}

function get_all_tests(lt_config) {
    return new Promise(function (resolve, reject) {
        let browsers = get_required_sessions(lt_config['browsers'])
        get_spec_files(lt_config["run_settings"]["specs"]).then(function (specs) {
            let tests = []
            for (let i in specs) {
                let relativePath = path.relative(process.cwd(), specs[i]);
                for (let j in browsers) {
                    tests.push({
                        "spec_file": specs[i],
                        "path": relativePath,
                        "browser": browsers[j]["browser"],
                        "platform": browsers[j]["platform"],
                        "version": browsers[j]["version"]
                    })
                }
            }
            resolve(tests)

        }).catch(function (err) {
            reject(err)
        })
    })

}


function make_batches(lt_config) {
    return new Promise(function (resolve, reject) {
        get_all_tests(lt_config).then(function (test_suite) {
            parallels = lt_config["run_settings"]["parallels"]
            if (parallels == 0) {
                resolve([test_suite])
            } else {
                let batches = []
                let batch_size = parallels
                for (t in test_suite) {
                    if (batch_size == parallels) {
                        batch = []
                        batch.push(test_suite[t])
                        batch_size--
                    } else {
                        batch.push(test_suite[t])
                        batch_size--
                    }
                    if (batch_size == 0) {
                        batches.push(batch)
                        batch_size = parallels
                    }
                }
                if (batch_size > 0 && batch_size < parallels) {
                    batches.push(batch)
                }
                resolve(batches)
            }
        }).then(function (err) {
            console.log(err)
        }).catch(function (err) {
            console.log(err)
        })

    })
}


module.exports = {
    make_batches: make_batches
}
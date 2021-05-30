module.exports={
    "lambdatest_auth": {
        "username": "<Your LambdaTest username>",
        "access_key": "<Your LambdaTest access key>"
    },
    "browsers": [
        {
            "browser": "Chrome",
            "platform": "Windows 10",
            "versions": [
                "86.0"
            ]
        },
        {
            "browser": "Firefox",
            "platform": "Windows 10",
            "versions": [
                "82.0"
            ]
        }
    ],
    "run_settings": {
        "cypress_config_file": "cypress.json",
        "build_name": "build-name",
        "parallels": 1,
        "specs":"./*.spec.js",
        "ignore_files":"",
        "feature_file_suppport": false,
        },
    "tunnel_settings": {
        "tunnel": false,
        "tunnelName": null
        
    }
}
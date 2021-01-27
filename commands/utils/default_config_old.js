module.exports={
    "lambdatest_auth": {
        "username": "<Your LambdaTest username>",
        "access_key": "<Your LambdaTest access key>"
    },
    "browsers": [
        {
            "browser": "chrome",
            "platform": "Windows 10",
            "versions": [
                "latest",
                "latest-1"
            ]
        },
        {
            "browser": "firefox",
            "platform": "Windows 10",
            "versions": [
                "latest",
                "latest-1"
            ]
        },
        {
            "browser": "edge",
            "platform": "Windows 10",
            "versions": [
                "latest",
                "latest-1"
            ]
        },
        {
            "browser": "chrome",
            "platform": "macOS Mojave",
            "versions": [
                "latest",
                "latest-1"
            ]
        },
        {
            "browser": "firefox",
            "platform": "macOS Mojave",
            "versions": [
                "latest",
                "latest-1"
            ]
        },
        {
            "browser": "edge",
            "platform": "macOS Mojave",
            "versions": [
                "latest",
                "latest-1"
            ]
        },
        {
            "browser": "chrome",
            "platform": "macOS Catalina",
            "versions": [
                "latest",
                "latest-1"
            ]
        },
        {
            "browser": "firefox",
            "platform": "macOS Catalina",
            "versions": [
                "latest",
                "latest-1"
            ]
        },
        {
            "browser": "edge",
            "platform": "macOS Catalina",
            "versions": [
                "latest",
                "latest-1"
            ]
        }
    ],
    "run_settings": {
        "cypress_config_file": "/path/to/<cypress config file>.json",
        "build_name": "build-name",
        "exclude": [],
        "parallels": "Here goes the number of parallels you want to run",
        "npm_dependencies": {}, //Dependency Packages
        "package_config_options": {}
    },
    "tunnel_settings": {
        "tunnel": false,
        "tunnelName": null
        //More param from tunnel interface
    }
}
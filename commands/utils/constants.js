
module.exports = {
    LOGIN_URL: "/cy/login",
    RUN_URL: "/cy/run",
    LT_CONFIG_NAME: "lambdatest-config.json",
    DEFAULT_TEST_PATH: ".",
    LAMBDA_CONFIG: "./lambdatest-config.json",
    prod: {
        INTEGRATION_BASE_URL: "https://beta-api.lambdatest.com/liis",
        BUILD_BASE_URL: "https://api.lambdatest.com/automation/api/v1/builds/",

    },
    stage: {
        INTEGRATION_BASE_URL: "https://stage-api.lambdatest.com/liis",
        BUILD_BASE_URL: "https://stage-api.lambdatest.com/automation/api/v1/builds/",

    },
    beta: {

        INTEGRATION_BASE_URL: "https://beta-api.lambdatest.com/liis",
        BUILD_BASE_URL: "https://api.lambdatest.com/automation/api/v1/builds/",


    }
}
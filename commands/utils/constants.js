
module.exports = {
    LOGIN_URL: "/cy/login",
    RUN_URL: "/cy/run",
    PROJECT_UPLOAD_URL:"/cy/upload",
    LT_CONFIG_NAME: "lambdatest-config.json",
    CYPRESS_CONFIG_NAME:"cypress-config.json",
    DEFAULT_TEST_PATH: ".",
    LAMBDA_CONFIG: "./lambdatest-config.json",
    prod: {
        INTEGRATION_BASE_URL: "https://beta-api.lambdatest.com/liis",
        BUILD_BASE_URL: "https://api.lambdatest.com/automation/api/v1/builds/",
        BUILD_STOP_URL:"https://beta-api.lambdatest.com/api/v1/test/stop?buildId="

    },
    stage: {
        INTEGRATION_BASE_URL: "https://stage-api.lambdatest.com/liis",
        BUILD_BASE_URL: "https://stage-api.lambdatest.com/automation/api/v1/builds/",
        BUILD_STOP_URL:"https://stage-api.lambdatest.com/api/v1/test/stop?buildId="

    },
    beta: {

        INTEGRATION_BASE_URL: "https://beta-api.lambdatest.com/liis",
        BUILD_BASE_URL: "https://api.lambdatest.com/automation/api/v1/builds/",
        BUILD_STOP_URL:"https://beta-api.lambdatest.com/api/v1/test/stop?buildId="


    }
}
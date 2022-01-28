module.exports = {
  LOGIN_URL: "/cy/login",
  RUN_URL: "/cy/run",
  RUN_WS_URL: "/cy/run/ws",
  PROJECT_UPLOAD_URL: "/url",
  CLI: "/cy/versions",
  LT_CONFIG_NAME: "lambdatest-config.json",
  CYPRESS_CONFIG_NAME: "cypress.json",
  DEFAULT_TEST_PATH: ".",
  LAMBDA_CONFIG: "./lambdatest-config.json",
  SUPPORTED_CYPRESS_VERSIONS: ["5", "6"],
  BUILD_END_STATES: "&status=running,queued,created,initiated,pqueued",
  CYPRESS_ENV_FILE_PATH: "cypress.env.json",
  prod: {
    INTEGRATION_BASE_URL: "https://api.lambdatest.com/liis",
    BUILD_BASE_URL: "https://api.lambdatest.com/automation/api/v1/builds/",
    BUILD_STOP_URL: "https://beta-api.lambdatest.com/api/v1/test/stop?buildId=",
    SESSION_URL:
      "https://api.lambdatest.com/automation/api/v1/sessions?limit=200&session_id=",
    REPORT_URL:
      "https://api.lambdatest.com/automation/api/v1/cypress/report/artefacts/test/",
  },
  beta: {
    INTEGRATION_BASE_URL: "https://api.cypress-v3.dev.lambdatest.io/liis",
    BUILD_BASE_URL:
      "https://api.cypress-v3.dev.lambdatest.io/automation/api/v1/builds/",
    BUILD_STOP_URL:
      "https://api.cypress-v3.dev.lambdatest.io/api/v1/test/stop?buildId=",
    SESSION_URL:
      "https://api.cypress-v3.dev.lambdatest.io/automation/api/v1/sessions?limit=200&session_id=",
    REPORT_URL:
      "https://api.cypress-v3.dev.lambdatest.io/automation/api/v1/cypress/artefacts/test/",
  },
  stage: {
    INTEGRATION_BASE_URL: "https://stage-api.lambdatest.com/liis",
    BUILD_BASE_URL:
      "https://stage-api.lambdatest.com/automation/api/v1/builds/",
    BUILD_STOP_URL:
      "https://stage-api.lambdatest.com/api/v1/test/stop?buildId=",
    SESSION_URL:
      "https://stage-api.lambdatest.com/automation/api/v1/sessions?limit=200&session_id=",
    REPORT_URL:
      "https://stage-api.lambdatest.com/automation/api/v1/cypress/artefacts/test/",
  },
};

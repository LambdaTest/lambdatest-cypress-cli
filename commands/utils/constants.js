module.exports = {
  LOGIN_URL: "/cy/login",
  RUN_URL: "/cy/run",
  RUN_WS_URL: "/cy/run/ws",
  PROJECT_UPLOAD_URL: "/url",
  CLI: "/cy/versions",
  LT_CONFIG_NAME: "lambdatest-config.json",
  LT_BASE_REPORTER_CONFIG_FILE_NAME: "base_reporter_config.json",
  LT_BASE_CUSTOM_SUPPORT_FILE_NAME: "custom_support_file.js",
  CYPRESS_CONFIG_NAME: "cypress.json",
  DEFAULT_TEST_PATH: ".",
  LAMBDA_CONFIG: "./lambdatest-config.json",
  SUPPORTED_CYPRESS_VERSIONS: ["5", "6"],
  WHITELISTED_ENV_VARS: ["CI_BUILD_ID"],
  BUILD_END_STATES:
    "&status=running,queued,created,initiated,pqueued,error,lambda error,failed",
  BUILD_ERROR_STATES: "&status=error,lambda error,failed",
  CYPRESS_ENV_FILE_PATH: "cypress.env.json",
  ENVS: ["stage", "beta", "prod", "preprod", "stage_new"],
  prod: {
    INTEGRATION_BASE_URL: "https://api.lambdatest.com/liis",
    BUILD_BASE_URL: "https://api.lambdatest.com/automation/api/v1/builds/",
    BUILD_STOP_URL: "https://api.lambdatest.com/api/v1/test/stop?sessionId=",
    SESSION_URL:
      "https://api.lambdatest.com/automation/api/v1/sessions?limit=200&session_id=",
    REPORT_URL:
      "https://api.lambdatest.com/automation/api/v1/cypress/artefacts/test/",
  },
  beta: {
    INTEGRATION_BASE_URL: "https://api.cypress-v3.dev.lambdatest.io/liis",
    BUILD_BASE_URL:
      "https://api.cypress-v3.dev.lambdatest.io/automation/api/v1/builds/",
    BUILD_STOP_URL:
      "https://api.cypress-v3.dev.lambdatest.io/api/v1/test/stop?sessionId=",
    SESSION_URL:
      "https://api.cypress-v3.dev.lambdatest.io/automation/api/v1/sessions?limit=200&session_id=",
    REPORT_URL:
      "https://api.cypress-v3.dev.lambdatest.io/automation/api/v1/cypress/artefacts/test/",
  },
  stage: {
    INTEGRATION_BASE_URL: "https://stage-api.lambdatestinternal.com/liis",
    BUILD_BASE_URL:
      "https://stage-api.lambdatestinternal.com/automation/api/v1/builds/",
    BUILD_STOP_URL:
      "https://stage-api.lambdatestinternal.com/api/v1/test/stop?sessionId=",
    SESSION_URL:
      "https://stage-api.lambdatestinternal.com/automation/api/v1/sessions?limit=200&session_id=",
    REPORT_URL:
      "https://stage-api.lambdatestinternal.com/automation/api/v1/cypress/artefacts/test/",
  },

  stage_new: {
    INTEGRATION_BASE_URL: "https://prestage-api.lambdatest.com/liis",
    BUILD_BASE_URL:
      "https://prestage-api.lambdatest.com/automation/api/v1/builds/",
    BUILD_STOP_URL:
      "https://prestage-api.lambdatest.com/api/v1/test/stop?sessionId=",
    SESSION_URL:
      "https://prestage-api.lambdatest.com/automation/api/v1/sessions?limit=200&session_id=",
    REPORT_URL:
      "https://prestage-api.lambdatest.com/automation/api/v1/cypress/artefacts/test/",
  },
  preprod: {
    INTEGRATION_BASE_URL: "https://preprod-api.lambdatest.com/liis",
    BUILD_BASE_URL:
      "https://preprod-api.lambdatest.com/automation/api/v1/builds/",
    BUILD_STOP_URL:
      "https://preprod-api.lambdatest.com/api/v1/test/stop?sessionId=",
    SESSION_URL:
      "https://preprod-api.lambdatest.com/automation/api/v1/sessions?limit=200&session_id=",
    REPORT_URL:
      "https://preprod-api.lambdatest.com/automation/api/v1/cypress/artefacts/test/",
  },
};

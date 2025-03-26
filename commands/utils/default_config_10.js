module.exports = {
  lambdatest_auth: {
    username: "<Your LambdaTest username>",
    access_key: "<Your LambdaTest access key>",
  },
  browsers: [
    {
      browser: "Chrome",
      platform: "Windows 10",
      versions: ["latest-1"],
    },
    {
      browser: "Firefox",
      platform: "Windows 10",
      versions: ["latest-1"],
    },
  ],
  run_settings: {
    reporter_config_file: "base_reporter_config.json",
    build_name: "build-name",
    parallels: 1,
    specs: "<path_of_cypress_spec_files>",
    ignore_files: "",
    network: false,
    headless: false,
    npm_dependencies: {
      cypress: "10.5.0",
    },
  },
  tunnel_settings: {
    tunnel: false,
    tunnel_name: null,
  },
};

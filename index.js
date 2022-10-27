#!/usr/bin/env node

const { init } = require("./commands/init");

const argv = require("yargs")
  .usage("Usage: $0 <command> [options]")
  .command("init", "create an intial config file", {}, function (argv) {
    require("./commands/init")(argv);
  })
  .command(
    "run",
    "run tests on lambdatest",
    function (yargs) {
      return yargs
        .option("ccf", {
          alias: "cypress-config-file",
          describe: "path of the config file",
          type: "string",
        })
        .option("lcf", {
          alias: "lambdatest-config-file",
          describe: "path of the lambdatest config file",
          type: "string",
        })
        .option("s", {
          alias: "specs",
          describe: "path of the spec file or directory or pattern",
          type: "string",
        })
        .option("env", {
          alias: "environment",
          describe: "environment",
          type: "string",
        })
        .option("bn", {
          alias: "build-name",
          describe: "build name",
          type: "string",
        })
        .option("t", {
          alias: "tags",
          describe: "test tags",
          type: "string",
        })
        .option("p", {
          alias: "parallels",
          describe: "no of parellel sessions",
          type: "string",
        })
        .option("envs", {
          alias: "env-variables",
          describe: "environment variables",
          type: "string",
        })
        .option("tun", {
          alias: "tunnel",
          describe: "tunnel",
          type: "string",
        })
        .option("tname", {
          alias: "tunnel_name",
          describe: "tunnel name",
          type: "string",
        })
        .option("brs", {
          alias: "browsers",
          describe: "browsers to run test format: platform:browser:version",
          type: "string",
        })
        .option("bi", {
          alias: "build-identifier",
          describe: "Build Identifier / Build Counter",
          type: "string",
        })
        .option("if", {
          alias: "ignore_files",
          describe: "Files to ignore in the project zip",
          type: "string",
        })
        .option("sync", {
          alias: "sync-mode",
          describe: "Sync Build",
          type: "string",
        })
        .option("autostart", {
          alias: "tat",
          describe: "Tunnel Auto Start",
          type: "string",
        })
        .option("headless", {
          alias: "headless-mode",
          describe: "Run in headless mode",
          type: "boolean",
        })
        .option("net", {
          alias: "network",
          describe: "Capture Network logs",
          type: "string",
        })
        .option("eof", {
          alias: "exit-on-failure",
          describe: "Exit With Code 1 on failure",
          type: "string",
        })
        .option("cy", {
          alias: "cypress_settings",
          describe: "Pass Cypress Settings",
          type: "string",
        })
        .option("geo", {
          alias: "geo_location",
          describe: "Pass Geo Country Code",
          type: "string",
        })
        .option("sof", {
          alias: "stop_on_failure",
          describe: "Stop other tests if any test in session gets errored out",
          type: "bool",
        })
        .option("ra", {
          alias: "reject_unauthorized",
          describe:
            "Default rejects self signed certificates in external requests",
          type: "bool",
        })
        .option("bt", {
          alias: "build-tags",
          describe: "build tags",
          type: "string",
        })
        .option("sys-envs", {
          alias: "sys-env-variables",
          describe: "system environment variables",
          type: "string",
        })
        .option("npm-f", {
          alias: "npm-force",
          describe: "force npm install",
          type: "bool",
        })
        .option("npm-lpd", {
          alias: "legacy-peer-deps",
          describe: "force npm install",
          type: "bool",
        })
        .option("vip", {
          alias: "vi-project",
          describe: "visual ui project name",
          type: "string",
        });
    },
    function (argv) {
      require("./commands/run")(argv);
    }
  )
  .command(
    "build-info",
    "info about the build",
    function (yargs) {
      return yargs
        .option("id", {
          alias: "build-id",
          describe: "Build Identifier",
          type: "string",
          demandOption: true,
        })
        .option("user", {
          alias: "username",
          describe: "username",
          type: "string",
        })
        .option("ak", {
          alias: "access_key",
          describe: "Access Key",
          type: "string",
        })
        .option("ra", {
          alias: "reject_unauthorized",
          describe:
            "Default rejects self signed certificates in external requests",
          type: "bool",
        })
        .option("env", {
          alias: "environment",
          describe: "environment",
          type: "string",
        });
    },
    function (argv) {
      require("./commands/build_info")(argv);
    }
  )
  .command(
    "build-stop",
    "stop all tests in the build",
    function (yargs) {
      return yargs
        .option("id", {
          alias: "session_id",
          describe: "Session Identifier",
          type: "string",
        })
        .option("user", {
          alias: "username",
          describe: "username",
          type: "string",
        })
        .option("ak", {
          alias: "access_key",
          describe: "Access Key",
          type: "string",
        })
        .option("env", {
          alias: "environment",
          describe: "environment",
          type: "string",
        })
        .option("ra", {
          alias: "reject_unauthorized",
          describe:
            "Default rejects self signed certificates in external requests",
          type: "bool",
        })
        .option("sls", {
          alias: "stop_last_session",
          describe: "stop last session",
          type: "bool",
        });
    },
    function (argv) {
      require("./commands/build_stop")(argv);
    }
  )
  .command(
    "generate-report",
    "generate session report",
    function (yargs) {
      return yargs
        .option("user", {
          alias: "username",
          describe: "Lambdatest Username of User",
          type: "string",
        })
        .option("ak", {
          alias: "access_key",
          describe: "Lambdatest Access Key of User",
          type: "string",
        })
        .option("sid", {
          alias: "session_id",
          describe: "Session Id",
          type: "string",
        })
        .option("ra", {
          alias: "reject_unauthorized",
          describe:
            "Default rejects self signed certificates in external requests",
          type: "bool",
        })
        .option("env", {
          alias: "environment",
          describe: "testing environment",
          type: "string",
        });
    },
    function (argv) {
      require("./commands/generate_reports")(argv);
    }
  )
  .help().argv;

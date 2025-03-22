#!/usr/bin/env node

const argv = require("yargs")
  .usage("Usage: $0 <command> [options]")
  .command(
    "init",
    "create an initial config file",
    function (yargs) {
      return yargs
        .option("cv", {
          alias: "cypress-version",
          describe: "Cypress version",
          type: "int",
        })
        .option("f", {
          alias: "config-file-name",
          describe: "Init config file name",
          type: "string",
        });
    },
    function (argv) {
      require("./commands/init").init_implementation(argv);
    }
  )
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
        .option("fullHar", {
          alias: "fullHar",
          describe: "Capture Full Har Network logs",
          type: "bool",
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
        .option("sys-env-keys", {
          alias: "sys-env-keys",
          describe: "system environment variables from .env file and os environment in order",
          type: "string",
        })
        .option("envfl", {
          alias: "env-file",
          describe: "path of .env file",
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
        }).option("vib", {
          alias: "vi-build",
          describe: "visual ui build name",
          type: "string",
        }).option("vibase", {
          alias: "vi-base",
          describe: "visual ui baseline",
          type: "bool",
        })
        .option("res", {
          alias: "resolution",
          describe: "machine resolution",
          type: "string",
        })
        .option("dp", {
          alias: "dedicated_proxy",
          describe: "dedicated proxy",
          type: "bool",
        })
        .option("npm_tun", {
          alias: "npm_via_tunnel",
          describe: "Install npm packages which are behind private VPN. Disclaimer:This will increase the build duration of your tests.",
          type: "bool",
        })
        .option("md", {
          alias: "max_duration",
          describe: "stops test if it is running more than max_duration minutes.",
          type: "string",
        })
        .option("cmd_log", {
          alias: "command_log",
          describe: "show command logs on dashboard.",
          type: "string",
        })
        .option("ret_fail", {
          alias: "retry_failed",
          describe: "run failed tests in a new build.",
          type: "bool",
        })
        .option("net_http2", {
          alias: "network_http2",
          describe: "Capture Http2 Network logs",
          type: "bool",
        })
        .option("net_ws", {
          alias: "network_ws",
          describe: "Bypass web socket calls for Network logs",
          type: "bool",
        })
        .option("node18", {
          alias: "useNode18",
          describe: "Use node version 18 for cypress",
          type: "bool",
        })
        .option("net_sse", {
          alias: "network_sse",
          describe: "Bypass sse events calls for Network logs",
          type: "bool",
        })
        .option("cypress_accessibility", {
          alias: "accessibility",
          describe: "enable accessibility testing for cypress.",
          type: "bool",
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
          alias: "build_id",
          describe: "Build Identifier",
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
        .option("slb", {
          alias: "stop_last_build",
          describe: "stop last build",
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
      require("./commands/generate_reports").generate_report_command(argv);
    }
  )
  .help().argv;

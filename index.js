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
      return (
        yargs
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
            alias: "env",
            describe: "environment",
            type: "string",
          })
          .option("bn", {
            alias: "build-name",
            describe: "build name",
            type: "string",
          })
          /*.option("t", {
          alias: "tags",
          describe: "build tags",
          type: "string",
        })*/
          .option("p", {
            alias: "parallels",
            describe: "no of parellel sessions",
            type: "string",
          })
          .option("envs", {
            alias: "envs",
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
            alias: "sync",
            describe: "Sync Build",
            type: "string",
          })
          .option("autostart", {
            alias: "tat",
            describe: "Tunnel Auto Start",
            type: "string",
          })
          .option("headless", {
            alias: "headless",
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
      );
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
          alias: "user",
          describe: "username",
          type: "string",
        })
        .option("access_key", {
          alias: "access_key",
          describe: "Access Key",
          type: "string",
        })
        .option("env", {
          alias: "env",
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
          alias: "build-id",
          describe: "Build Identifier",
          type: "string",
          demandOption: true,
        })
        .option("user", {
          alias: "user",
          describe: "username",
          type: "string",
        })
        .option("access_key", {
          alias: "access_key",
          describe: "Access Key",
          type: "string",
        })
        .option("env", {
          alias: "env",
          describe: "environment",
          type: "string",
        });
    },
    function (argv) {
      require("./commands/build_stop")(argv);
    }
  )
  .help().argv;

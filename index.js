#!/usr/bin/env node

const { init } = require('./commands/init');

const argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('init', 'create an intial config file', function (yargs) {
    return yargs.option('p', {
      alias: 'path',
      describe: 'path of the file',
      type: 'string'
    })
  },
    function (argv) {
      require("./commands/init")(argv);
      
    }
  ).command('run', 'run tests on lambdatest', function (yargs) {
    return yargs.option('ccf', {
      alias: 'cypress-config-file',
      describe: 'path of the config file',
      type: 'string'
    }).option('lcf', {
      alias: 'lambdatest-config-file',
      describe: 'path of the lambdatest config file',
      type: 'string'
    }).option('s', {
      alias: 'specs',
      describe: 'path of the spec file or directory or pattern',
      type: 'string'
    }).option('env', {
      alias: 'env',
      describe: 'environment variables',
      type: 'string'
    }).option('bn', {
      alias: 'build-name',
      describe: 'build name',
      type: 'string'
    }).option('t', {
      alias: 'tags',
      describe: 'build tags',
      type: 'string'
    }).option('p', {
      alias: 'parellels',
      describe: 'no of parellel sessions',
      type: 'string'
    })
  },
    function (argv) {
      console.log("In run command")
      require("./commands/run")(argv);
      
    }
  )
  .help()
  .argv



///Users/japneet/Desktop/cypress_poc/cypress/integration/examples/actions.spec.js,/Users/japneet/Desktop/cypress_poc/cypress/integration/examples/aliasing.spec.js


//Run with spec glob without config
//node ./index.js run --spec "commands/*.js"

// Run with spec glob with config
//node ./index.js run --spec "*.js" --ccf /Users/japneet/Desktop/lamdatest-cypress/node_modules/config.json

//node ./index.js run --specs "/Users/japneet/Desktop/cypress_poc/cypress/integration/examples/actions.spec.js,/Users/japneet/Desktop/cypress_poc/cypress/integration/examples/*.js,/Users/japneet/Desktop/lamdatest-cypress/commands/*.js" --ccf"/Users/japneet/Desktop/cypress_poc/cypress/*.json"  --lcf "/Users/japneet/Desktop/lamdatest-cypress/lambdatest-config.json" -p 11

//node ./index.js run --specs "/Users/japneet/Desktop/cypress_poc/cypress/integration/examples/actions.spec.js,/Users/japneet/Desktop/lamdatest-cypress/commands/*.js" --ccf "/Users/japneet/Desktop/cypress_poc/cypress.json"  --lcf "/Users/japneet/Desktop/lambdatest-config.json" -p 11
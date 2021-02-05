
# LambdaTest Cypress CLI
The lambdatest-cypress-cli is LambdaTest's command-line interface (CLI) aimed to help you run your Cypress tests on LambdaTest platform.


# Installation

You can run your first Cypress test on the LambdaTest platform in just 3 simple steps:

## Installing the LambdaTest CLI

You can do install the LambdaTest-Cypress CLI with the help of npm, using the below command:

```bash
npm install -g lambdatest-cypress-cli
```


# Usage

## Step 1:

Before using this plugin, save the LambdaTest username and access key to environment variables LT_USERNAME and LT_ACCESS_KEY, as described in [LambdaTest Documentation](https://www.lambdatest.com/support/docs/using-environment-variables-for-authentication-credentials).

## Step 2: Setup configurations on which you want to run your test
Once you have installed the LambdaTest-Cypress CLI, now you need to setup the configuration. You can do that using the below command:




```bash
# Create a sample LambdaTest Cypress configuration file
lambdatest-cypress init
```
In this configuration file, setup:
- **auth**: Firstly you need to set up your LambdaTest credentials that will help you run your test on the Online Selenium Grid.
- **browsers**: Secondly, you need to set up the browser and OS combinations upon which you want the Cypress testing to be done. You can choose among the 2000+ browser and OS combinations that LambdaTest provides.
- **run_settings**: Lastly, you need to set the other desired capabilities of your Cypress test suite, which includes cypress_version, build_name, visual feedback settings, number of parallel sessions, etc.

## Step 3: Execute tests
Once you have the above two pre-requisites ready, you can execute your Cypress tests on the LambdaTest platform. To do so, you will need the following command:

```bash
lambdatest-cypress run
```

As soon as the tests starts executing, you can view them running. Just visit your [LambdaTest Automation Dashboard](https://beta-automation.lambdatest.com/).

For each test, you can view the live video feed, screenshots for each test run, view console logs, terminal logs, and do much more using the LambdaTest platform.



To learn more about LambdaTest Cypress CLI, refer to the [LambdaTest Cypress Documentation](https://www.lambdatest.com/support/docs/getting-started-with-cypress-testing/)

# Documentation

With the LambdaTest and Cypress integration document, you will see how to get started with Cypress testing on the LambdaTest platform using the LambdaTest Cypress CLI.

- [Prerequisites To Get Started](https://www.lambdatest.com/support/docs/getting-started-with-cypress-testing/#/prerequisites)
- [Running Your First Cypress Test](https://www.lambdatest.com/support/docs/getting-started-with-cypress-testing/#/run-first-tests)
- [View Results On LambdaTest](https://www.lambdatest.com/support/docs/getting-started-with-cypress-testing#view-results)
- [Running Tests Locally](https://www.lambdatest.com/support/docs/getting-started-with-cypress-testing#run-locally)
- [Parallel Cypress Testing](https://www.lambdatest.com/support/docs/getting-started-with-cypress-testing#parallel-cypress-testing)
- [List Of LambdaTest Cypress CLI Commands](https://www.lambdatest.com/support/docs/getting-started-with-cypress-testing#cli-commands)




# About LambdaTest

[LambdaTest](https://www.lambdatest.com/) is a cloud based selenium grid infrastructure that can help you run automated cross browser compatibility tests on 2000+ different browser and operating system environments. LambdaTest supports all programming languages and frameworks that are supported with Selenium, and have easy integrations with all popular CI/CD platforms. It's a perfect solution to bring your [selenium automation testing](https://www.lambdatest.com/selenium-automation) to cloud based infrastructure that not only helps you increase your test coverage over multiple desktop and mobile browsers, but also allows you to cut down your test execution time by running tests on parallel.

# License

Licensed under the [MIT license](./LICENSE).

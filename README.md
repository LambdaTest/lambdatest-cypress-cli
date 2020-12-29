# lambdatest-cypress-cli
Allows Customers to run cypress test on Lambdatest Infrastructure

# Usage

### Create a default Lambdatest config

- Create a config in current directory

```shell
lambdatest-cypress init
```
- Create a config in specific location
```shell
lambdatest-cypress init directory_path
```
```shell
lambdatest-cypress init directory/filename
```
### Run test on LambdaTest

```shell
lambdatest-cypress run --lcf "lambdatest-config.json"
```

```shell
lambdatest-cypress run --specs "/integration/examples/*.spec.js" --ccf "cypress.json"  --lcf "lambdatest-config.json" -p 1
```
Run following command to get more configuration parameters
```shell
lambdatest-cypress run --help
```

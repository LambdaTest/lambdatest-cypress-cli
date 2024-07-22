const path = require("node:path");
const fs = require("fs");
let counter =0;
const Accessibility = (on, config) => {

    on('task', {
        lambdatest_log(message) {
          console.log(message)
          return null
        },
        getCounterValue() {
          return counter;
      },
      incrementCounterValue() {
          counter += 1;
          return counter;
      },
        initializeFile(filePath) {
          if (!fs.existsSync(filePath)) {
            // counter = counter +1;
            // filePath = 'cypress/reports/accessibilityfinal-results' + counter + '.json';
              fs.writeFileSync(filePath, '[]');
          }
          return filePath;
        }
  })

    let browser_validation = true;
    console.log(`debug point 1.`);

    on('before:browser:launch', (browser = {}, launchOptions) => {
        try {
            console.log(`debug point 2. ext path` + process.env.ACCESSIBILITY_EXTENSION_PATH)
          if (process.env.ACCESSIBILITY_EXTENSION_PATH !== undefined) {
            // if (browser.name !== 'chrome') {
            //   console.log(`Accessibility Automation will run only on Chrome browsers.`);
            //   browser_validation = false;
            // }
            // if (browser.name === 'chrome' && browser.majorVersion <= 94) {
            //   console.log(`Accessibility Automation will run only on Chrome browser version greater than 94.`);
            //   browser_validation = false;
            // }
            // if (browser.isHeadless === true) {
            //   console.log(`Accessibility Automation will not run on legacy headless mode. Switch to new headless mode or avoid using headless mode.`);
            //   browser_validation = false;
            // }
            if (browser_validation) {
                
              const accessibility_ext_path = process.env.ACCESSIBILITY_EXTENSION_PATH
              console.log(`debug point 3. ext path` + accessibility_ext_path)
              // launchOptions.extensions.push(accessibility_ext_path);
            //TODO: set dynamic path 
            launchOptions.args.push(`--load-extension=` + accessibility_ext_path)
              return launchOptions
            }
          }
        } catch(err) {}
        
      })
      console.log('log', "picking env from system " + process.env.TEST_VAR);
      config.env.TEST_VAR= process.env.TEST_VAR;
      config.env.WCAG_CRITERIA= process.env.WCAG_CRITERIA;
      config.env.BEST_PRACTICE= process.env.BEST_PRACTICE;
      config.env.NEEDS_REVIEW= process.env.NEEDS_REVIEW;
      

      return config;
}

module.exports = Accessibility;
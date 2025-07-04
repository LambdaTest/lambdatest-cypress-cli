const fs = require("fs");
const path = require('path');
const Accessibility = (on, config) => {

    on('task', {
        lambdatest_log(message) {
          console.log(message)
          return null
        },
        initializeFile(filePath) {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          if (!fs.existsSync(filePath)) {
              fs.writeFileSync(filePath, '[]');
          }
          return filePath;
        },
        readFileIfExists(filePath) {
          const fullPath = path.resolve(filePath);
          if (fs.existsSync(fullPath)) {
            const fileContent = fs.readFileSync(fullPath, 'utf8');
            return { exists: true, content:fileContent }; 
          } else {
            return { exists: false, content: null }; // Return null if the file doesn't exist
          }
        }
  })

    let browser_validation = true;

    on('before:browser:launch', (browser = {}, launchOptions) => {
        try {
          if (process.env.ACCESSIBILITY_EXTENSION_PATH !== undefined) {
            if (browser.name !== 'chrome' && browser.name !== 'edge') {
              console.log(`Accessibility Automation will run only on Chrome and Edge browsers. But browser used is ` + browser.name);
              browser_validation = false;
            }
            if (browser.name === 'chrome' && browser.majorVersion <= 94) {
              console.log(`Accessibility Automation will run only on Chrome browser version greater than 94.`);
              browser_validation = false;
            }
            if (browser.isHeadless === true) {
              console.log(`Accessibility Automation will not run on legacy headless mode. Switch to new headless mode or avoid using headless mode.`);
              browser_validation = false;
            }
            if (!process.env.ACCESSIBILITY){
              console.log(`Accessibility Automation is disabled.`);
              browser_validation = false;
            }
            if (browser_validation) {
                
            const accessibility_ext_path = process.env.ACCESSIBILITY_EXTENSION_PATH
        
            launchOptions.args.push(`--load-extension=` + accessibility_ext_path)
            launchOptions.args.push('--disable-features=DisableLoadExtensionCommandLineSwitch')
              return launchOptions
            }
          }
        } catch(err) {
          console.log(`Error in loading Accessibility Automation extension: ${err.message}`);
        }
        
      })
      config.env.WCAG_CRITERIA= process.env.WCAG_CRITERIA;
      config.env.BEST_PRACTICE= process.env.BEST_PRACTICE;
      config.env.NEEDS_REVIEW= process.env.NEEDS_REVIEW;
      config.env.ACCESSIBILITY_REPORT_PATH = process.env.ACCESSIBILITY_REPORT_PATH;
      config.env.ACCESSIBILITY = process.env.ACCESSIBILITY;
      config.env.TEST_ID = process.env.TEST_ID;
      config.env.ACCESSIBILITY_OVERIDE_COMMANDS = process.env.ACCESSIBILITY_OVERIDE_COMMANDS;
      config.env.GENERATE_REPORT_API = process.env.GENERATE_REPORT_API || "NA";
      console.log(`parameter for accessibility report ACCESSIBILITY - ` + config.env.ACCESSIBILITY)
      console.log(`parameter for accessibility report WCAG_CRITERIA - ` + config.env.WCAG_CRITERIA)
      console.log(`parameter for accessibility report BEST_PRACTICE -` + config.env.BEST_PRACTICE)
      console.log(`parameter for accessibility report NEEDS_REVIEW -` + config.env.NEEDS_REVIEW)
      console.log(`parameter for accessibility report ACCESSIBILITY_REPORT_PATH -` + config.env.ACCESSIBILITY_REPORT_PATH)
      console.log(`parameter for accessibility report TEST_ID -` + config.env.TEST_ID)
      console.log(`parameter for accessibility report ACCESSIBILITY_EXTENSION_PATH -` + process.env.ACCESSIBILITY_EXTENSION_PATH)
      console.log(`parameter for accessibility report ACCESSIBILITY_OVERIDE_COMMANDS -` + config.env.ACCESSIBILITY_OVERIDE_COMMANDS)
      console.log(`parameter for accessibility report GENERATE_REPORT_API -` + config.env.GENERATE_REPORT_API)


      return config;
}

module.exports = Accessibility;
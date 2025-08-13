const fs = require("fs");
const path = require('path');

function getImageResolution(buffer) {
  try {
    if (buffer.length < 24) {
      return { width: 0, height: 0 };
    }
    
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    for (let i = 0; i < 8; i++) {
      if (buffer[i] !== pngSignature[i]) {
        return { width: 0, height: 0 };
      }
    }
  
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    
    return { width, height };
  } catch (error) {
    console.error(`Error extracting image resolution: ${error.message}`);
    return { width: 0, height: 0 };
  }
}

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
        },
        convertScreenshotToBase64(filePath) {
          try {
            const fullPath = path.resolve(filePath);
            
            if (fs.existsSync(fullPath)) {
              const imageBuffer = fs.readFileSync(fullPath);
              const base64String = imageBuffer.toString('base64');
              
              const imageResolution = getImageResolution(imageBuffer);
              return {
                base64: base64String,
                resolution: imageResolution
              };
            } else {
              console.log(`Screenshot file not found at: ${fullPath}`);
              return null;
            }
          } catch (error) {
            console.error(`Error converting screenshot to base64: ${error.message}`);
            return null;
          }
        },
        deleteFile(filePath) {
          try {
            const fullPath = path.resolve(filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              return true;
            } else {
              console.log(`File not found for deletion: ${filePath}`);
              return false;
            }
          } catch (error) {
            console.error(`Error deleting file: ${error.message}`);
            return false;
          }
        }
  })

    let browser_validation = true;

    on('before:browser:launch', (browser = {}, launchOptions) => {
        try {
          if (process.env.ACCESSIBILITY_EXTENSION_PATH !== undefined) {
            if (browser.name !== 'chrome' && browser.name !== 'edge' && browser.name !== 'chrome-for-testing') {
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
      config.env.CAPTURE_SCREENSHOT = process.env.CAPTURE_SCREENSHOT;
      config.env.PASSED_TEST_CASES = process.env.PASSED_TEST_CASES;

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
      console.log(`parameter for accessibility report CAPTURE_SCREENSHOT -` + config.env.CAPTURE_SCREENSHOT)
      console.log(`parameter for accessibility report PASSED_TEST_CASES -` + config.env.PASSED_TEST_CASES)

      return config;
}

module.exports = Accessibility;
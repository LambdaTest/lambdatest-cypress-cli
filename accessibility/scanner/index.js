const fs = require("fs")

const LambdatestLog = (message) => {
    if (!Cypress.env('LAMBDATEST_LOGS')) return;
    cy.task('lambdatest_log', message);
  }

const commandsToWrap = ['visit', 'click', 'type', 'request', 'dblclick', 'rightclick', 'clear', 'check', 'uncheck', 'select', 'trigger', 'selectFile', 'scrollIntoView', 'scroll', 'scrollTo', 'blur', 'focus', 'go', 'reload', 'submit', 'viewport', 'origin'];

const setScanConfig = (win, payload) =>
    new Promise(async (resolve, reject) => {
        const isHttpOrHttps = /^(http|https):$/.test(win.location.protocol);
    if (!isHttpOrHttps) {
      resolve();
    }

    function startScan() {
        console.log('log', "Accessibility setting scan config")
        function onScanComplete(event) {
          win.document.removeEventListener("automation-custom-event", onScanComplete);
        console.log('log', "Recieved scan config data " + event.detail)
          resolve(event.detail);
        }
        
          win.document.addEventListener("automation-custom-event", onScanComplete);
        const e = new CustomEvent("accessibility-extension-custom-event", { detail: payload });
        win.document.dispatchEvent(e);
        
        // add timeout of 4 sec

          setTimeout(() => {
            reject(new Error('automation-custom-event not received within timeout'));
          }, 9000); // Adding a custom timeout for the event
      }
      startScan();

})

const getScanData = (win, payload) =>
    new Promise( async (resolve,reject) => {
      const isHttpOrHttps = /^(http|https):$/.test(window.location.protocol);
      if (!isHttpOrHttps) {
        resolve();
      }
  
  
      function getSummary() {
        function onReceiveSummary(event) {
  
          win.document.removeEventListener("automation-custom-event", onReceiveSummary);
          resolve(event.detail);
        }
        
  
        win.document.addEventListener("automation-custom-event", onReceiveSummary);
        const e = new CustomEvent("accessibility-extension-custom-event", { detail: payload });
        win.document.dispatchEvent(e);

        setTimeout(() => {
          reject(new Error('automation-custom-event not received within timeout'));
        }, 9000); // Adding a custom timeout for the event

      }
  
      
    getSummary();
      
    })

const shouldScanForAccessibility = (attributes) => {
    if (Cypress.env("IS_ACCESSIBILITY_EXTENSION_LOADED") !== "true") return false;
  
    const extensionPath = Cypress.env("ACCESSIBILITY_EXTENSION_PATH");
    const isHeaded = Cypress.browser.isHeaded;
  
    if (!isHeaded || (extensionPath === undefined)) return false;
  
    let shouldScanTestForAccessibility = true;
  
    if (Cypress.env("INCLUDE_TAGS_FOR_ACCESSIBILITY") || Cypress.env("EXCLUDE_TAGS_FOR_ACCESSIBILITY")) {
      try {
        let includeTagArray = [];
        let excludeTagArray = [];
        if (Cypress.env("INCLUDE_TAGS_FOR_ACCESSIBILITY")) {
          includeTagArray = Cypress.env("INCLUDE_TAGS_FOR_ACCESSIBILITY").split(";")
        }
        if (Cypress.env("EXCLUDE_TAGS_FOR_ACCESSIBILITY")) {
          excludeTagArray = Cypress.env("EXCLUDE_TAGS_FOR_ACCESSIBILITY").split(";")
        }
  
        const fullTestName = attributes.title;
        const excluded = excludeTagArray.some((exclude) => fullTestName.includes(exclude));
        const included = includeTagArray.length === 0 || includeTags.some((include) => fullTestName.includes(include));
        shouldScanTestForAccessibility = !excluded && included;
      } catch (error) {
        LambdatestLog("Error while validating test case for accessibility before scanning. Error : ", error);
      }
    }
  
    return shouldScanTestForAccessibility;
  }

Cypress.on('command:start', async (command) => {
  if(!command || !command.attributes) return;
  if(command.attributes.name == 'window' || command.attributes.name == 'then' || command.attributes.name == 'wrap' || command.attributes.name == 'wait') {
      return;
  }

  if (!commandsToWrap.includes(command.attributes.name)) return;

// const attributes = Cypress.mocha.getRunner().suite.ctx.currentTest || Cypress.mocha.getRunner().suite.ctx._runnable;

// let shouldScanTestForAccessibility = shouldScanForAccessibility(attributes);
// if (!shouldScanTestForAccessibility) return;
// console.log('log', "debugging scan form command " + command.attributes.name);
console.log('log', "debugging scan form command " + command.attributes.name);
cy.window().then((win) => {
    // LambdatestLog('Performing scan form command ' + command.attributes.name);
    let wcagCriteriaValue = Cypress.env("WCAG_CRITERIA") || "wcag21a";
    let bestPracticeValue = Cypress.env("BEST_PRACTICE") || false;
    let needsReviewValue = Cypress.env("NEEDS_REVIEW") || true;
    
    const payloadToSend = {
    message: 'SET_CONFIG',
    wcagCriteria: wcagCriteriaValue,
    bestPractice: bestPracticeValue,
    needsReview: needsReviewValue
    }
    let testId = Cypress.env("TEST_ID") || ""
    // const filePath = 'cypress/reports/accessibilityReport_' + testId + '.json';
    const filePath = Cypress.env("ACCESSIBILITY_REPORT_PATH") || 'cypress/results/accessibilityReport_' + testId + '.json';

    cy.wrap(setScanConfig(win, payloadToSend), {timeout: 30000}).then((res) => {
    // LambdatestLog('log', "logging report **************")
    console.log('logging config reponse', res);
    
    const payload = {
    message: 'GET_LATEST_SCAN_DATA',
    }
    // cy.wait(5000);
    cy.wrap(getScanData(win, payload), {timeout: 30000}).then((res) => {
    LambdatestLog('log', "logging report **************")
    

    cy.task('initializeFile', filePath).then((filePath) => {
      cy.readFile(filePath, { log: true, timeout: 30000 }).then((fileContent) => {
          let resultsArray = [{}];
          console.log('logging report', res);
          // If the file is not empty, parse the existing content
          if (fileContent) {
              try {
                  resultsArray = JSON.parse(JSON.stringify(fileContent));
              } catch (e) {
                console.log("parsing error for content " , fileContent)
                  console.log('Error parsing JSON file:', e);
                  return;
              }
          }
          console.log('debugging res', res.message);
          if (res.message == "GET_LATEST_SCAN_DATA") {
          // Append the new result
            resultsArray.push(res);
            console.log('resultsarray logging', resultsArray);
          }

          // Write the updated content back to the file
          cy.writeFile(filePath, resultsArray, { log: true, timeout: 30000 });
      });
    });
        });

    });
})
})


Cypress.on('command:end', (command) => {

// console.log('log', "debugging scan form command end " + command.attributes.name);
return;
})
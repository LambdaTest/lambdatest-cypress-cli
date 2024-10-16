
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
        

          setTimeout(() => {
            resolve(new Error('automation-custom-event not received within timeout'));
          }, 45000);
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
          resolve(new Error('automation-custom-event not received within timeout'));
        }, 45000);

      }
  
      
    getSummary();
      
    })

Cypress.on('command:start', async (command) => {
  if(!command || !command.attributes) return;
  if(command.attributes.name == 'window' || command.attributes.name == 'then' || command.attributes.name == 'wrap' || command.attributes.name == 'wait') {
      return;
  }

  if (!commandsToWrap.includes(command.attributes.name)) return;
  let isAccessibilityLoaded = Cypress.env("ACCESSIBILITY") || false;
  if (!isAccessibilityLoaded){
    console.log('log', "accessibility not enabled " + isAccessibilityLoaded);
    return;
  } 


console.log('log', "debugging scan form command " + command.attributes.name);
cy.window().then((win) => {
    let wcagCriteriaValue = Cypress.env("WCAG_CRITERIA") || "wcag21a";
    let bestPracticeValue = Cypress.env("BEST_PRACTICE") || false;
    let needsReviewValue = Cypress.env("NEEDS_REVIEW") || true;
    bestPracticeValue =  bestPracticeValue == "true" ? true : false;
    needsReviewValue = needsReviewValue == "true" ? true : false;
    const payloadToSend = {
    message: 'SET_CONFIG',
    wcagCriteria: wcagCriteriaValue,
    bestPractice: bestPracticeValue,
    needsReview: needsReviewValue
    }

    console.log('log', "payload to send " + payloadToSend);
    let testId = Cypress.env("TEST_ID") || ""
    
    const filePath = Cypress.env("ACCESSIBILITY_REPORT_PATH") || 'cypress/results/accessibilityReport_' + testId + '.json';

    cy.wrap(setScanConfig(win, payloadToSend), {timeout: 30000}).then((res) => {
    console.log('logging config reponse', res);
    
    const payload = {
    message: 'GET_LATEST_SCAN_DATA',
    }

    cy.wrap(getScanData(win, payload), {timeout: 45000}).then((res) => {
    LambdatestLog('log', "scanning data ");
    

    cy.task('initializeFile', filePath).then((filePath) => {
      cy.readFile(filePath, { log: true, timeout: 45000 }).then((fileContent) => {
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
          console.log('scanned data recieved is', res.message);
          if (res.message == "GET_LATEST_SCAN_DATA") {
          // Append the new result
            resultsArray.push(res);
            console.log('resultsarray logging', resultsArray);
          }

          // Write the updated content back to the file
          cy.writeFile(filePath, resultsArray, { log: true, timeout: 45000 });
      });
    });
        });

    });
})
})


Cypress.on('command:end', (command) => {

return;
})


afterEach(() => {
console.log("after each hook")
  cy.window().then((win) => {
    let wcagCriteriaValue = Cypress.env("WCAG_CRITERIA") || "wcag21a";
    let bestPracticeValue = Cypress.env("BEST_PRACTICE") || false;
    let needsReviewValue = Cypress.env("NEEDS_REVIEW") || false;

    bestPracticeValue =  bestPracticeValue == "true" ? true : false;
    needsReviewValue = needsReviewValue == "true" ? true : false;

    let isAccessibilityLoaded = Cypress.env("ACCESSIBILITY") || false;
    if (!isAccessibilityLoaded){
      console.log('log', "accessibility not enabled " + isAccessibilityLoaded);
      return;
    } 
    
    const payloadToSend = {
    message: 'SET_CONFIG',
    wcagCriteria: wcagCriteriaValue,
    bestPractice: bestPracticeValue,
    needsReview: needsReviewValue
    }

    console.log('log', "payload to send " + payloadToSend);
    let testId = Cypress.env("TEST_ID") || ""
    
    const filePath = Cypress.env("ACCESSIBILITY_REPORT_PATH") || 'cypress/results/accessibilityReport_' + testId + '.json';

    cy.wrap(setScanConfig(win, payloadToSend), {timeout: 30000}).then((res) => {
    console.log('logging config reponse', res);
    
    const payload = {
    message: 'GET_LATEST_SCAN_DATA',
    }

    cy.wrap(getScanData(win, payload), {timeout: 45000}).then((res) => {
    LambdatestLog('log', "scanning data ");
    

    cy.task('initializeFile', filePath).then((filePath) => {
      cy.readFile(filePath, { log: true, timeout: 45000 }).then((fileContent) => {
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
          console.log('scanned data recieved is', res.message);
          if (res.message == "GET_LATEST_SCAN_DATA") {
          // Append the new result
            resultsArray.push(res);
            console.log('resultsarray logging', resultsArray);
          }

          // Write the updated content back to the file
          cy.writeFile(filePath, resultsArray, { log: true, timeout: 45000 });
      });
    });
        });

    });
})


})
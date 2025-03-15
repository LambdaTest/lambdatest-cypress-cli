
const LambdatestLog = (message) => {
    if (!Cypress.env('LAMBDATEST_LOGS')) return;
    cy.task('lambdatest_log', message);
}

const commandsToOverride = [
    'visit', 'click', 'type', 'request', 'dblclick', 'rightclick', 'clear', 'check',
    'uncheck', 'select', 'trigger', 'selectFile', 'scrollIntoView', 'scrollTo',
    'blur', 'focus', 'go', 'reload', 'submit', 'viewport', 'origin'
];

let currentWindow = null;
Cypress.Commands.add('storeWindowObject', () => {
    cy.window().then(win => {
        currentWindow = win;
    });
});

beforeEach(() => {
    cy.storeWindowObject();
});

const setScanConfig = (win, payload) => {
    return new Promise((resolve, reject) => {
        const isHttpOrHttps = /^(http|https):$/.test(win.location.protocol);
        if (!isHttpOrHttps) return resolve();

        console.log('log', "Accessibility setting scan config");

        function onScanComplete(event) {
            win.document.removeEventListener("automation-custom-event", onScanComplete);
            console.log('log', "Received scan config data: ", event.detail);
            resolve(event.detail);
        }
        console.log('log', "Dispactched event");
        win.document.addEventListener("automation-custom-event", onScanComplete);
        const e = new CustomEvent("accessibility-extension-custom-event", { detail: payload });
        win.document.dispatchEvent(e);

        setTimeout(() => {
            reject(new Error('automation-custom-event not received within timeout'));
        }, 45000);
    });
};

const getScanData = (win, payload) => {
    return new Promise((resolve, reject) => {
        const isHttpOrHttps = /^(http|https):$/.test(win.location.protocol);
        if (!isHttpOrHttps) return resolve();

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
    });
};

const sendScanData = (win, payload) => {
    return new Promise((resolve, reject) => {
        const isHttpOrHttps = /^(http|https):$/.test(win.location.protocol);
        if (!isHttpOrHttps) return resolve();

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
    });
};

async function processAccessibilityReport(url) {
    try {
        let wcagCriteriaValue = Cypress.env("WCAG_CRITERIA") || "wcag21a";
        let bestPracticeValue = Cypress.env("BEST_PRACTICE") === "true";
        let needsReviewValue = Cypress.env("NEEDS_REVIEW") !== "false"; // Default to true

        const payloadToSend = {
            message: 'SET_CONFIG',
            wcagCriteria: wcagCriteriaValue,
            bestPractice: bestPracticeValue,
            needsReview: needsReviewValue
        };

        console.log('log', "SET SCAN: Payload to send: for url: ", payloadToSend,url);
        try {
            console.log("Current Window Object:", currentWindow);
            let setResult = await setScanConfig(currentWindow, payloadToSend);
            console.log('SET SCAN: response:', setResult);
        } catch (err) {
            console.error("SET SCAN: Error while setting scan", err);
            return ;
        }

        let scanData;
        try {
            const payload = {message: 'GET_LATEST_SCAN_DATA'};
            scanData = await getScanData(currentWindow, payload);
            LambdatestLog("GET SCAN:LambdaTest Accessibility: Scanning URL");
        } catch (err) {
            console.error("GET SCAN:Error while setting scan", err);
            return ;
        }

       console.log("Logging response before sending to API:", scanData);

        try {

            const testId = Cypress.env("TEST_ID") || "dummy1234"
            const reportAPI = Cypress.env("GENERATE_REPORT_API") || "http://localhost:43000/api/v1.0/cypress/generateAccessibilityReport"
            const filePath =  Cypress.env("ACCESSIBILITY_REPORT_PATH") || ('cypress/results/accessibilityReport_'  + testId + '.json');
            console.log("TestID is",testId);
            const payloadToSend = {
                message: 'SEND_ACESSIBILITY_DATA',
                testId : testId,
                scanData: scanData,
                accessibilityReportPath:filePath,
                apiUrl: reportAPI
            };
           try{
               let response = await sendScanData(currentWindow,payloadToSend);
               console.log("Accessibility Report Response:", response);
           }catch(e){
               console.error("Error in Accessibility Report Response:",e);
           }

        }catch(err) {
            console.error("Error while making api", err);
        }

    } catch (error) {
        LambdatestLog("ERROR", error);
    }
}

function oldprocessAccessibilityReport(win){
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
                cy.task('readFileIfExists', filePath,{ log: true, timeout: 45000 }).then((result) => {
                    let resultsArray = [{}];
                    console.log('logging report', res);
                    // If the file is not empty, parse the existing content
                    if (result.exists && result.content) {
                        try {
                            resultsArray = JSON.parse(result.content);
                        } catch (e) {
                            console.log("parsing error for content " , result.content)
                            console.log('Error parsing JSON file:', e);
                            return;
                        }
                    } else if(!result.exists) {
                        console.log('accessibility file does not exist');
                    }
                    if (res) {
                        console.log('scanned data recieved is', res.message);
                    }

                    if (res && res.message == "GET_LATEST_SCAN_DATA") {
                        try {
                            // Append the new result
                            resultsArray.push(res);
                            console.log('resultsarray logging', resultsArray);
                        } catch (e) {
                            console.log('Error pushing issues to array:', e);
                        }
                    }

                    // Write the updated content back to the file
                    cy.writeFile(filePath, resultsArray, { log: true, timeout: 45000 });
                });
            });
        });

    });
}

const overRideCommands = Cypress.env("ACCESSIBILITY_OVERIDE_COMMANDS");
if (overRideCommands) {
    commandsToOverride.forEach((command) => {
        Cypress.Commands.overwrite(command, (originalFn, url, options) => {
            let isAccessibilityLoaded = Cypress.env("ACCESSIBILITY") || false;
            if (!isAccessibilityLoaded) {
                console.log('log', "Accessibility not enabled.");
                return originalFn(url, options);
            }


            return originalFn(url, options).then(async () => {

                await processAccessibilityReport(url);
            })

        });
    });
}else{
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
            oldprocessAccessibilityReport(win);
        })
    })

}





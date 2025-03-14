
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



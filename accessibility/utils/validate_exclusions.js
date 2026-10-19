const axios = require("axios");
const constants = require("../../commands/utils/constants.js");
const { createHttpsAgent } = require("../../commands/utils/proxy_agent.js");

const TIMEOUT_MS = 5000;

// Mirrors lambda-integration-interface, which applies these before the caps are
// built; sending the raw value would count against a scan the user is not running.
const WCAG_VERSION_DEFAULT = "wcag21aa";
const BEST_PRACTICE_DEFAULT = true;
const NEEDS_REVIEW_DEFAULT = false;

const asList = (value) => (Array.isArray(value) ? value : []);

const asBool = (value, fallback) =>
  typeof value === "boolean" ? value : fallback;

// LAS echoes an unknown entry exactly as it was written, so this matches.
const strip = (list, unknown) => {
  const drop = new Set(unknown || []);
  return list.filter((v) => !drop.has(v));
};

const emptyRuleSetMessage = (data) =>
  `All ${data.byCategory + data.byRule} rules in scope for ${data.wcagDisplay} ` +
  `were excluded by this configuration (${data.byCategory} by category, ` +
  `${data.byRule} by rule). Include at least one rule to run an accessibility ` +
  `scan. Remove a value from accessibility.excludeRuleCategories or ` +
  `accessibility.excludeRules, or set accessibility=false to disable ` +
  `accessibility scanning for this session.`;

// Unknown entries only warn, since an id axe does not know excludes nothing.
// An empty effective set rejects, so no build is created for a scan that can
// report nothing.
function validate_exclusions(lt_config, env = "prod", rejectUnauthorized) {
  return new Promise(function (resolve, reject) {
    const run_settings = lt_config["run_settings"] || {};
    const excludeRules = asList(run_settings["accessibility.excludeRules"]);
    const excludeRuleCategories = asList(
      run_settings["accessibility.excludeRuleCategories"]
    );
    const wcagVersion =
      run_settings["accessibility.wcagVersion"] || WCAG_VERSION_DEFAULT;
    const bestPractice = asBool(
      run_settings["accessibility.bestPractice"],
      BEST_PRACTICE_DEFAULT
    );
    const needsReview = asBool(
      run_settings["accessibility.needsReview"],
      NEEDS_REVIEW_DEFAULT
    );

    if (excludeRules.length === 0 && excludeRuleCategories.length === 0) {
      return resolve();
    }

    const auth = lt_config["lambdatest_auth"] || {};
    if (!auth["username"] || !auth["access_key"]) {
      return resolve();
    }

    const token = Buffer.from(
      `${auth["username"]}:${auth["access_key"]}`
    ).toString("base64");

    axios({
      method: "post",
      url: constants[env].ACCESSIBILITY_VALIDATE_URL,
      headers: { Authorization: "Basic " + token },
      data: {
        platform: "web",
        wcagVersion,
        bestPractice,
        needsReview,
        excludeRules,
        excludeRuleCategories,
      },
      timeout: TIMEOUT_MS,
      proxy: false,
      httpsAgent: createHttpsAgent(rejectUnauthorized !== false),
    })
      .then(function (response) {
        const data = response.data || {};
        (data.unknownRules || []).forEach((id) =>
          console.log(
            `Accessibility: unknown rule id "${id}", it will not exclude anything`
          )
        );
        (data.unknownCategories || []).forEach((slug) =>
          console.log(
            `Accessibility: unknown category "${slug}", it will not exclude anything`
          )
        );
        if (data.effectiveEmpty) {
          return reject(emptyRuleSetMessage(data));
        }

        if ("accessibility.excludeRules" in run_settings) {
          run_settings["accessibility.excludeRules"] = strip(
            excludeRules,
            data.unknownRules
          );
        }
        if ("accessibility.excludeRuleCategories" in run_settings) {
          run_settings["accessibility.excludeRuleCategories"] = strip(
            excludeRuleCategories,
            data.unknownCategories
          );
        }
        resolve();
      })
      .catch(function (error) {
        console.log(
          `Accessibility: could not validate exclusions (${error.message}), continuing without the check`
        );
        resolve();
      });
  });
}

module.exports = { validate_exclusions: validate_exclusions };

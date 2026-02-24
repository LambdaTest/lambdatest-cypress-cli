const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

/**
 * Creates an HTTPS agent that supports authenticated proxy servers
 * via HTTPS_PROXY/HTTP_PROXY environment variables and respects
 * the rejectUnauthorized SSL setting.
 *
 * @param {boolean} rejectUnauthorized - Whether to reject unauthorized SSL certs (default: true)
 * @returns {https.Agent} Configured HTTPS agent
 */
function createHttpsAgent(rejectUnauthorized = true) {
  const proxyUrl = process.env.HTTPS_PROXY ||
                   process.env.https_proxy ||
                   process.env.HTTP_PROXY ||
                   process.env.http_proxy;

  if (proxyUrl) {
    return new HttpsProxyAgent(proxyUrl, { rejectUnauthorized });
  }

  return new https.Agent({ rejectUnauthorized });
}

module.exports = { createHttpsAgent };

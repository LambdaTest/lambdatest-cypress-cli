const https = require('https');
const url = require('url');
const HttpsProxyAgent = require('https-proxy-agent');

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
    // https-proxy-agent v5 accepts a string URL or a url.parse() result object.
    // We parse it ourselves so we can merge in rejectUnauthorized for the
    // target TLS connection (used after the CONNECT tunnel is established).
    const parsed = url.parse(proxyUrl);
    parsed.rejectUnauthorized = rejectUnauthorized;
    return new HttpsProxyAgent(parsed);
  }

  return new https.Agent({ rejectUnauthorized: rejectUnauthorized });
}

module.exports = { createHttpsAgent };

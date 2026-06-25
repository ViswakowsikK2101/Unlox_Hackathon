/**
 * CampusFlow Backend - Module 3 (Utilities)
 * File: src/utils/httpClient.js
 * Description: Reusable, lightweight HTTP client built on native fetch/global patterns 
 * optimized for downstream internal service integration vectors.
 */

const logger = require('./logger');

/**
 * Utility wrapper executing outgoing HTTP calls with integrated error intercept and telemetry.
 * * @param {string} url - Target destination path
 * @param {Object} [options={}] - Standard request settings override block
 */
async function request(url, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    method,
    headers,
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  logger.info({ method, url }, 'Initiating outbound HTTP request');

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    
    let responseData = null;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      logger.error(
        { method, url, status: response.status, responseData },
        'Outbound HTTP request operational failure encounter'
      );
      throw new Error(`HTTP Client Error: ${response.status} - ${response.statusText}`);
    }

    logger.debug({ method, url, status: response.status }, 'Outbound HTTP request completed successfully');
    return responseData;
  } catch (error) {
    logger.error({ method, url, error: error.message }, 'Outbound HTTP engine transport error');
    throw error;
  }
}

const httpClient = {
  get: (url, headers = {}) => request(url, { method: 'GET', headers }),
  post: (url, body, headers = {}) => request(url, { method: 'POST', body, headers }),
  put: (url, body, headers = {}) => request(url, { method: 'PUT', body, headers }),
  delete: (url, headers = {}) => request(url, { method: 'DELETE', headers }),
};

/**
 * ============================================================================
 * ARCHITECTURAL FLOW MARKS
 * ============================================================================
 * * --- BACKEND PROCESSING ---
 * Abstracts manual configurations, implementing standardized, uniform JSON streaming pipelines.
 * * --- PYTHON AI INTEGRATION POINT ---
 * Leveraged by backend services to issue raw POST tasks for actions such as Notice Summarization 
 * and Flashcard Generation over HTTP endpoints.
 * * --- N8N WEBHOOK INTEGRATION POINT ---
 * Dispatches automation hooks directly down to n8n workflow listeners for WhatsApp updates 
 * and scheduled calendar notifications.
 */

module.exports = httpClient;
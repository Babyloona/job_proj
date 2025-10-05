const axios = require('axios');
const BITRIX = process.env.BITRIX_WEBHOOK_URL.replace(/\/$/, '');

async function callMethod(method, payload) {
  const url = `${BITRIX}/${method}`;
  try {
   const resp = await axios.post(url,JSON.stringify(payload), {
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
    });
    if (resp.data && resp.data.error) {
      const e = resp.data;
      const err = new Error(e.error_description || e.error || 'Bitrix error');
      err.code = 'BITRIX_ERROR';
      err.details = e;
      throw err;
    }
    return resp.data.result || resp.data;
  } catch (err) {
    if (err.response && err.response.data) {
      const e = new Error('Bitrix call failed');
      e.code = 'BITRIX_ERROR';
      e.details = err.response.data;
      throw e;
    }
    throw err;
  }
}

module.exports = { callMethod };

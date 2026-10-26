// Services return { ok: true, ... } or { ok: false, message } for rule-breaking actions
// (accepting twice, leaving a team you own, ...). This turns such a result into a response:
// success -> 200 { message, ...extra }, failure -> 409 { error: reason }.
const { httpError } = require('./httpError');

function sendResult(res, result, successMessage, extra = {}) {
  if (!result.ok) throw httpError(409, result.message);
  res.json({ message: successMessage, ...extra });
}

module.exports = { sendResult };

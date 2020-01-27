const { serverless } = require('@probot/serverless-lambda');
const app = require('./handler');
module.exports.probot = serverless(app);
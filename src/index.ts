const { serverless } = require('@probot/serverless-lambda')
const appFn = require('./handler')
var app = serverless(appFn)
module.exports.probot = function (request: any, context: any, callback: any) {
    if (request.isBase64Encoded) {
        request.body = Buffer.from(request.body, "base64").toString('utf8');
    }
    app(request, context, callback);
}
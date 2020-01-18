import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { FileArchive } from "@pulumi/pulumi/asset";

const curStack = pulumi.getStack();
const role = createLambdaPolicy(`${curStack}_pre_flight_backend_role`, { project: "pre-flight", environment: curStack });
const lambda = new aws.lambda.Function(`${curStack}_pre_flight_backend`, {
    runtime: aws.lambda.NodeJS12dXRuntime,
    role: role.arn,
    handler: 'index.probot',
    code: new FileArchive("../output"),
    timeout: 10
});

const endpoint = new awsx.apigateway.API(`${curStack}_pre_filght`, {
    routes: [{
        path: "",
        method: "POST",
        eventHandler: lambda
    }],
});

function createLambdaPolicy(name: string, tags: object) {
    const role = new aws.iam.Role(name, {
        tags,
        assumeRolePolicy: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "sts:AssumeRole",
                    Principal: {
                        Service: "lambda.amazonaws.com"
                    },
                    Effect: "Allow",
                    Sid: ""
                }
            ]
        }
    });
    new aws.iam.RolePolicy(`${name}-log-policy`,
        {
            role: role.id,
            policy: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    Resource: "arn:aws:logs:*:*:*"
                }]
            }
        });
    return role;
}

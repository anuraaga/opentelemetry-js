"use strict";
/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const resource_assertions_1 = require("@opentelemetry/resources/test/util/resource-assertions");
const src_1 = require("../../src");
describe('awsLambdaDetector', () => {
    let oldEnv;
    beforeEach(() => {
        oldEnv = Object.assign({}, process.env);
    });
    afterEach(() => {
        process.env = oldEnv;
    });
    describe('on lambda', () => {
        it('fills resource', async () => {
            process.env.AWS_LAMBDA_FUNCTION_NAME = 'name';
            process.env.AWS_LAMBDA_FUNCTION_VERSION = 'v1';
            process.env.AWS_REGION = 'us-east-1';
            const resource = await src_1.awsLambdaDetector.detect();
            resource_assertions_1.assertCloudResource(resource, {
                provider: 'aws',
                region: 'us-east-1',
            });
            assert.strictEqual(resource.attributes['faas.name'], 'name');
            assert.strictEqual(resource.attributes['faas.version'], 'v1');
        });
    });
    describe('not on lambda', () => {
        it('returns empty resource', async () => {
            process.env.AWS_LAMBDA_FUNCTION_VERSION = 'v1';
            process.env.AWS_REGION = 'us-east-1';
            const resource = await src_1.awsLambdaDetector.detect();
            resource_assertions_1.assertEmptyResource(resource);
        });
    });
});
//# sourceMappingURL=AwsLambdaDetector.test.js.map
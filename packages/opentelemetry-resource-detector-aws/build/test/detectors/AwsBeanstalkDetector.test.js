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
const sinon = require("sinon");
const src_1 = require("../../src");
const resource_assertions_1 = require("@opentelemetry/resources/test/util/resource-assertions");
describe('BeanstalkResourceDetector', () => {
    const err = new Error('failed to read config file');
    const data = {
        version_label: 'app-5a56-170119_190650-stage-170119_190650',
        deployment_id: '32',
        environment_name: 'scorekeep',
    };
    const noisyData = {
        noise: 'noise',
        version_label: 'app-5a56-170119_190650-stage-170119_190650',
        deployment_id: '32',
        environment_name: 'scorekeep',
    };
    let readStub, fileStub;
    afterEach(() => {
        sinon.restore();
    });
    it('should successfully return resource data', async () => {
        fileStub = sinon
            .stub(src_1.AwsBeanstalkDetector, 'fileAccessAsync')
            .resolves();
        readStub = sinon
            .stub(src_1.AwsBeanstalkDetector, 'readFileAsync')
            .resolves(JSON.stringify(data));
        sinon.stub(JSON, 'parse').returns(data);
        const resource = await src_1.awsBeanstalkDetector.detect();
        sinon.assert.calledOnce(fileStub);
        sinon.assert.calledOnce(readStub);
        assert.ok(resource);
        resource_assertions_1.assertServiceResource(resource, {
            name: 'elastic_beanstalk',
            namespace: 'scorekeep',
            version: 'app-5a56-170119_190650-stage-170119_190650',
            instanceId: '32',
        });
    });
    it('should successfully return resource data with noise', async () => {
        fileStub = sinon
            .stub(src_1.AwsBeanstalkDetector, 'fileAccessAsync')
            .resolves();
        readStub = sinon
            .stub(src_1.AwsBeanstalkDetector, 'readFileAsync')
            .resolves(JSON.stringify(noisyData));
        sinon.stub(JSON, 'parse').returns(noisyData);
        const resource = await src_1.awsBeanstalkDetector.detect();
        sinon.assert.calledOnce(fileStub);
        sinon.assert.calledOnce(readStub);
        assert.ok(resource);
        resource_assertions_1.assertServiceResource(resource, {
            name: 'elastic_beanstalk',
            namespace: 'scorekeep',
            version: 'app-5a56-170119_190650-stage-170119_190650',
            instanceId: '32',
        });
    });
    it('should return empty resource when failing to read file', async () => {
        fileStub = sinon
            .stub(src_1.AwsBeanstalkDetector, 'fileAccessAsync')
            .resolves();
        readStub = sinon
            .stub(src_1.AwsBeanstalkDetector, 'readFileAsync')
            .rejects(err);
        const resource = await src_1.awsBeanstalkDetector.detect();
        sinon.assert.calledOnce(fileStub);
        sinon.assert.calledOnce(readStub);
        assert.ok(resource);
        resource_assertions_1.assertEmptyResource(resource);
    });
    it('should return empty resource when config file does not exist', async () => {
        fileStub = sinon
            .stub(src_1.AwsBeanstalkDetector, 'fileAccessAsync')
            .rejects(err);
        readStub = sinon
            .stub(src_1.AwsBeanstalkDetector, 'readFileAsync')
            .resolves(JSON.stringify(data));
        const resource = await src_1.awsBeanstalkDetector.detect();
        sinon.assert.calledOnce(fileStub);
        sinon.assert.notCalled(readStub);
        assert.ok(resource);
        resource_assertions_1.assertEmptyResource(resource);
    });
});
//# sourceMappingURL=AwsBeanstalkDetector.test.js.map
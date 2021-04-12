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
const nock = require("nock");
const sinon = require("sinon");
const assert = require("assert");
const src_1 = require("../../src");
const resource_assertions_1 = require("@opentelemetry/resources/test/util/resource-assertions");
const K8S_SVC_URL = src_1.awsEksDetector.K8S_SVC_URL;
const AUTH_CONFIGMAP_PATH = src_1.awsEksDetector.AUTH_CONFIGMAP_PATH;
const CW_CONFIGMAP_PATH = src_1.awsEksDetector.CW_CONFIGMAP_PATH;
describe('awsEksDetector', () => {
    const errorMsg = {
        fileNotFoundError: new Error('cannot find cgroup file'),
    };
    const correctCgroupData = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm';
    const mockedClusterResponse = '{"data":{"cluster.name":"my-cluster"}}';
    const mockedAwsAuth = 'my-auth';
    const k8s_token = 'Bearer 31ada4fd-adec-460c-809a-9e56ceb75269';
    let readStub, fileStub, getCredStub;
    beforeEach(() => {
        nock.disableNetConnect();
        nock.cleanAll();
    });
    afterEach(() => {
        sinon.restore();
        nock.enableNetConnect();
    });
    describe('on successful request', () => {
        it('should return an aws_eks_instance_resource', async () => {
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .resolves();
            readStub = sinon
                .stub(src_1.AwsEksDetector, 'readFileAsync')
                .resolves(correctCgroupData);
            getCredStub = sinon
                .stub(src_1.awsEksDetector, '_getK8sCredHeader')
                .resolves(k8s_token);
            const scope = nock('https://' + K8S_SVC_URL)
                .persist()
                .get(AUTH_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => mockedAwsAuth)
                .get(CW_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => mockedClusterResponse);
            const resource = await src_1.awsEksDetector.detect();
            scope.done();
            sinon.assert.calledOnce(fileStub);
            sinon.assert.calledTwice(readStub);
            sinon.assert.calledTwice(getCredStub);
            assert.ok(resource);
            resource_assertions_1.assertK8sResource(resource, {
                clusterName: 'my-cluster',
            });
            resource_assertions_1.assertContainerResource(resource, {
                id: 'bcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm',
            });
        });
        it('should return a resource with clusterName attribute without cgroup file', async () => {
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .resolves();
            readStub = sinon
                .stub(src_1.AwsEksDetector, 'readFileAsync')
                .onSecondCall()
                .rejects(errorMsg.fileNotFoundError);
            getCredStub = sinon
                .stub(src_1.awsEksDetector, '_getK8sCredHeader')
                .resolves(k8s_token);
            const scope = nock('https://' + K8S_SVC_URL)
                .persist()
                .get(AUTH_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => mockedAwsAuth)
                .get(CW_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => mockedClusterResponse);
            const resource = await src_1.awsEksDetector.detect();
            scope.done();
            assert.ok(resource);
            resource_assertions_1.assertK8sResource(resource, {
                clusterName: 'my-cluster',
            });
        });
        it('should return a resource with container ID attribute without a clusterName', async () => {
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .resolves();
            readStub = sinon
                .stub(src_1.AwsEksDetector, 'readFileAsync')
                .resolves(correctCgroupData);
            getCredStub = sinon
                .stub(src_1.awsEksDetector, '_getK8sCredHeader')
                .resolves(k8s_token);
            const scope = nock('https://' + K8S_SVC_URL)
                .persist()
                .get(AUTH_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => mockedAwsAuth)
                .get(CW_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => '');
            const resource = await src_1.awsEksDetector.detect();
            scope.done();
            assert.ok(resource);
            resource_assertions_1.assertContainerResource(resource, {
                id: 'bcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm',
            });
        });
        it('should return a resource with clusterName attribute when cgroup file does not contain valid Container ID', async () => {
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .resolves();
            readStub = sinon
                .stub(src_1.AwsEksDetector, 'readFileAsync')
                .onSecondCall()
                .resolves('');
            getCredStub = sinon
                .stub(src_1.awsEksDetector, '_getK8sCredHeader')
                .resolves(k8s_token);
            const scope = nock('https://' + K8S_SVC_URL)
                .persist()
                .get(AUTH_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => mockedAwsAuth)
                .get(CW_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => mockedClusterResponse);
            const resource = await src_1.awsEksDetector.detect();
            scope.done();
            assert.ok(resource);
            assert.ok(resource);
            resource_assertions_1.assertK8sResource(resource, {
                clusterName: 'my-cluster',
            });
        });
        it('should return an empty resource when not running on Eks', async () => {
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .resolves('');
            readStub = sinon
                .stub(src_1.AwsEksDetector, 'readFileAsync')
                .resolves(correctCgroupData);
            getCredStub = sinon
                .stub(src_1.awsEksDetector, '_getK8sCredHeader')
                .resolves(k8s_token);
            const scope = nock('https://' + K8S_SVC_URL)
                .persist()
                .get(AUTH_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => '');
            const resource = await src_1.awsEksDetector.detect();
            scope.done();
            assert.ok(resource);
            resource_assertions_1.assertEmptyResource(resource);
        });
        it('should return an empty resource when k8s token file does not exist', async () => {
            const errorMsg = {
                fileNotFoundError: new Error('cannot file k8s token file'),
            };
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .rejects(errorMsg.fileNotFoundError);
            const resource = await src_1.awsEksDetector.detect();
            assert.ok(resource);
            resource_assertions_1.assertEmptyResource(resource);
        });
        it('should return an empty resource when containerId and clusterName are invalid', async () => {
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .resolves('');
            readStub = sinon
                .stub(src_1.AwsEksDetector, 'readFileAsync')
                .onSecondCall()
                .rejects(errorMsg.fileNotFoundError);
            getCredStub = sinon
                .stub(src_1.awsEksDetector, '_getK8sCredHeader')
                .resolves(k8s_token);
            const scope = nock('https://' + K8S_SVC_URL)
                .persist()
                .get(AUTH_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => mockedAwsAuth)
                .get(CW_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(200, () => '');
            const resource = await src_1.awsEksDetector.detect();
            scope.isDone();
            assert.ok(resource);
            resource_assertions_1.assertEmptyResource(resource);
        });
    });
    describe('on unsuccesful request', () => {
        it('should return an empty resource when timed out', async () => {
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .resolves();
            readStub = sinon
                .stub(src_1.AwsEksDetector, 'readFileAsync')
                .resolves(correctCgroupData);
            getCredStub = sinon
                .stub(src_1.awsEksDetector, '_getK8sCredHeader')
                .resolves(k8s_token);
            const scope = nock('https://' + K8S_SVC_URL)
                .persist()
                .get(AUTH_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .delayConnection(2500)
                .reply(200, () => mockedAwsAuth);
            const resource = await src_1.awsEksDetector.detect();
            scope.done();
            assert.ok(resource);
            resource_assertions_1.assertEmptyResource(resource);
        }).timeout(src_1.awsEksDetector.TIMEOUT_MS + 100);
        it('should return an empty resource when receiving error response code', async () => {
            fileStub = sinon
                .stub(src_1.AwsEksDetector, 'fileAccessAsync')
                .resolves();
            readStub = sinon
                .stub(src_1.AwsEksDetector, 'readFileAsync')
                .resolves(correctCgroupData);
            getCredStub = sinon
                .stub(src_1.awsEksDetector, '_getK8sCredHeader')
                .resolves(k8s_token);
            const scope = nock('https://' + K8S_SVC_URL)
                .persist()
                .get(AUTH_CONFIGMAP_PATH)
                .matchHeader('Authorization', k8s_token)
                .reply(404, () => new Error());
            const resource = await src_1.awsEksDetector.detect();
            scope.done();
            assert.ok(resource);
            resource_assertions_1.assertEmptyResource(resource);
        });
    });
});
//# sourceMappingURL=AwsEksDetector.test.js.map
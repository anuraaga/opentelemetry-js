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

import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  cache,
  awsEcsDetector,
} from '../../src/platform/node/detectors/AwsEcsDetector';
import {
  assertEmptyResource,
  assertContainerResource,
} from '../util/resource-assertions';
import { NoopLogger } from '@opentelemetry/core';
import * as os from 'os';

describe('BeanstalkResourceDetector', () => {
  const errorMsg = {
    fileNotFoundError: new Error('cannot find cgroup file'),
    hostNameError: new Error('failed to obtain host name'),
  };

  const correctCgroupData =
    'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm';
  const noisyCgroupData = `\n\n\n abcdefghijklmnopqrstuvwxyz \n ${correctCgroupData}`;
  const hostNameData = 'abcd.test.testing.com';

  let readStub, hostStub;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    process.env.ECS_CONTAINER_METADATA_URI_V4 = '';
    process.env.ECS_CONTAINER_METADATA_URI = '';
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully return resource data', async () => {
    process.env.ECS_CONTAINER_METADATA_URI_V4 = 'ecs_metadata_v4_uri';
    hostStub = sandbox.stub(os, 'hostname').returns(hostNameData);
    readStub = sandbox.stub(cache, 'readFileAsync').resolves(correctCgroupData);

    const resource = await awsEcsDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(hostStub);
    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertContainerResource(resource, {
      name: 'abcd.test.testing.com',
      id:
        'bcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm',
    });
  });

  it('should successfully return resource data with noisy cgroup file', async () => {
    process.env.ECS_CONTAINER_METADATA_URI = 'ecs_metadata_v3_uri';
    hostStub = sandbox.stub(os, 'hostname').returns(hostNameData);
    readStub = sandbox.stub(cache, 'readFileAsync').resolves(noisyCgroupData);

    const resource = await awsEcsDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(hostStub);
    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertContainerResource(resource, {
      name: 'abcd.test.testing.com',
      id:
        'bcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm',
    });
  });

  it('should empty resource without environmental variable', async () => {
    hostStub = sandbox.stub(os, 'hostname').returns(hostNameData);
    readStub = sandbox.stub(cache, 'readFileAsync').resolves(correctCgroupData);

    const resource = await awsEcsDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.notCalled(hostStub);
    sandbox.assert.notCalled(readStub);
    assert.ok(resource);
    assertEmptyResource(resource);
  });

  it('should return resource only with hostname attribute without cgroup file', async () => {
    process.env.ECS_CONTAINER_METADATA_URI_V4 = 'ecs_metadata_v4_uri';
    hostStub = sandbox.stub(os, 'hostname').returns(hostNameData);
    readStub = sandbox
      .stub(cache, 'readFileAsync')
      .rejects(errorMsg.fileNotFoundError);

    const resource = await awsEcsDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(hostStub);
    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertContainerResource(resource, {
      name: 'abcd.test.testing.com',
    });
  });

  it('should return resource only with hostname attribute when cgroup file does not contain valid container ID', async () => {
    process.env.ECS_CONTAINER_METADATA_URI_V4 = 'ecs_metadata_v4_uri';
    hostStub = sandbox.stub(os, 'hostname').returns(hostNameData);
    readStub = sandbox.stub(cache, 'readFileAsync').resolves('');

    const resource = await awsEcsDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(hostStub);
    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertContainerResource(resource, {
      name: 'abcd.test.testing.com',
    });
  });

  it('should return resource only with container ID attribute without hostname', async () => {
    process.env.ECS_CONTAINER_METADATA_URI_V4 = 'ecs_metadata_v4_uri';
    hostStub = sandbox.stub(os, 'hostname').throws(errorMsg.hostNameError);
    readStub = sandbox.stub(cache, 'readFileAsync').resolves(correctCgroupData);

    const resource = await awsEcsDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(hostStub);
    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertContainerResource(resource, {
      id:
        'bcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm',
    });
  });

  it('should return empty resource when both hostname and container ID are invalid', async () => {
    process.env.ECS_CONTAINER_METADATA_URI_V4 = 'ecs_metadata_v4_uri';
    hostStub = sandbox.stub(os, 'hostname').throws(errorMsg.hostNameError);
    readStub = sandbox
      .stub(cache, 'readFileAsync')
      .rejects(errorMsg.fileNotFoundError);

    const resource = await awsEcsDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(hostStub);
    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertEmptyResource(resource);
  });
});

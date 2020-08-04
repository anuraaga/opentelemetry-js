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
import { awsBeanstalkDetector } from '../../src/platform/node/detectors/AwsBeanstalkDetector';
import {
  assertEmptyResource,
  assertServiceResource,
} from '../util/resource-assertions';
import { NoopLogger } from '@opentelemetry/core';
import * as fs from 'fs';

describe('BeanstalkResourceDetector', () => {
  const err = new Error('failed to load file');
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

  let readStub;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully return resource data', async () => {
    readStub = sandbox.stub(fs, 'readFile').yields(null, JSON.stringify(data));
    sandbox.stub(JSON, 'parse').returns(data);

    const resource = await awsBeanstalkDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertServiceResource(resource, {
      name: 'elastic_beanstalk',
      namespace: 'scorekeep',
      version: 'app-5a56-170119_190650-stage-170119_190650',
      instanceId: '32',
    });
  });

  it('should successfully return resource data with noise', async () => {
    readStub = sandbox
      .stub(fs, 'readFile')
      .yields(null, JSON.stringify(noisyData));
    sandbox.stub(JSON, 'parse').returns(noisyData);

    const resource = await awsBeanstalkDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertServiceResource(resource, {
      name: 'elastic_beanstalk',
      namespace: 'scorekeep',
      version: 'app-5a56-170119_190650-stage-170119_190650',
      instanceId: '32',
    });
  });

  it('should return empty resource when failing to read file', async () => {
    readStub = sandbox.stub(fs, 'readFile').yields(err, null);

    const resource = await awsBeanstalkDetector.detect({
      logger: new NoopLogger(),
    });

    sandbox.assert.calledOnce(readStub);
    assert.ok(resource);
    assertEmptyResource(resource);
  });
});

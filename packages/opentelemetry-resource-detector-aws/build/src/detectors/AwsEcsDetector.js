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
exports.awsEcsDetector = exports.AwsEcsDetector = void 0;
const api_1 = require("@opentelemetry/api");
const resources_1 = require("@opentelemetry/resources");
const util = require("util");
const fs = require("fs");
const os = require("os");
const core_1 = require("@opentelemetry/core");
/**
 * The AwsEcsDetector can be used to detect if a process is running in AWS
 * ECS and return a {@link Resource} populated with data about the ECS
 * plugins of AWS X-Ray. Returns an empty Resource if detection fails.
 */
class AwsEcsDetector {
    constructor() {
        this.CONTAINER_ID_LENGTH = 64;
        this.DEFAULT_CGROUP_PATH = '/proc/self/cgroup';
    }
    async detect(_config) {
        const env = core_1.getEnv();
        if (!env.ECS_CONTAINER_METADATA_URI_V4 && !env.ECS_CONTAINER_METADATA_URI) {
            api_1.diag.debug('AwsEcsDetector failed: Process is not on ECS');
            return resources_1.Resource.empty();
        }
        const hostName = os.hostname();
        const containerId = await this._getContainerId();
        return !hostName && !containerId
            ? resources_1.Resource.empty()
            : new resources_1.Resource({
                [resources_1.CONTAINER_RESOURCE.NAME]: hostName || '',
                [resources_1.CONTAINER_RESOURCE.ID]: containerId || '',
            });
    }
    /**
     * Read container ID from cgroup file
     * In ECS, even if we fail to find target file
     * or target file does not contain container ID
     * we do not throw an error but throw warning message
     * and then return null string
     */
    async _getContainerId() {
        try {
            const rawData = await AwsEcsDetector.readFileAsync(this.DEFAULT_CGROUP_PATH, 'utf8');
            const splitData = rawData.trim().split('\n');
            for (const str of splitData) {
                if (str.length > this.CONTAINER_ID_LENGTH) {
                    return str.substring(str.length - this.CONTAINER_ID_LENGTH);
                }
            }
        }
        catch (e) {
            api_1.diag.warn(`AwsEcsDetector failed to read container ID: ${e.message}`);
        }
        return undefined;
    }
}
exports.AwsEcsDetector = AwsEcsDetector;
AwsEcsDetector.readFileAsync = util.promisify(fs.readFile);
exports.awsEcsDetector = new AwsEcsDetector();
//# sourceMappingURL=AwsEcsDetector.js.map
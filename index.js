const tc = require('@actions/tool-cache');
const core = require('@actions/core');
const exec = require('@actions/exec');
const os = require('os');
const fs = require('fs');
const path = require('path');

const name = 'aliyun';
const platform = os.platform();
const version = core.getInput('aliyun-cli-version') ? core.getInput('aliyun-cli-version') : '3.0.55';

const configs = [
    {input: 'mode', flag: '--mode', default: 'AK'},
    {input: 'profile', flag: '--profile', default: null},
    {input: 'language', flag: '--language', default: 'zh'},
    {input: 'region', flag: '--region', default: null},
    {input: 'config-path', flag: '--config-path', default: null},
    {input: 'access-key-id', flag: '--access-key-id', default: null},
    {input: 'access-key-secret', flag: '--access-key-secret', default: null},
    {input: 'sts-token', flag: '--sts-token', default: null},
    {input: 'ram-role-name', flag: '--ram-role-name', default: null},
    {input: 'ram-role-arn', flag: '--ram-role-arn', default: null},
    {input: 'role-session-name', flag: '--role-session-name', default: null},
    {input: 'private-key', flag: '--private-key', default: null},
    {input: 'key-pair-name', flag: '--key-pair-name', default: null},
    {input: 'read-timeout', flag: '--read-timeout', default: null},
    {input: 'connect-timeout', flag: '--connect-timeout', default: null},
    {input: 'retry-count', flag: '--retry-count', default: null},
    {input: 'skip-secure-verify', flag: '--skip-secure-verify', default: null},
    {input: 'expired-seconds', flag: '--expired-seconds', default: null},
    {input: 'secure', flag: '--secure', default: null},
    {input: 'force', flag: '--force', default: null},
    {input: 'endpoint', flag: '--endpoint', default: null},
    {input: 'version', flag: '--version', default: null},
    {input: 'header', flag: '--header', default: null},
    {input: 'body', flag: '--body', default: null},
    {input: 'pager', flag: '--pager', default: null},
    {input: 'output', flag: '--output', default: null},
    {input: 'waiter', flag: '--waiter', default: null},
    {input: 'dryrun', flag: '--dryrun', default: null},
    {input: 'quiet', flag: '--quiet', default: null},
];


for (const config of configs) {
    let val = core.getInput(config.input);
    val = (!val && config.default) ? config.default : val;
    config.value = val;
}

async function run() {
    const [system, ext, extractFunc, executable] = (function () {
        switch (platform) {
            case 'linux':
                return ['linux', 'tgz', 'extractTar', name];
            case 'darwin':
                return ['macosx', 'tgz', 'extractTar', name];
            case 'win32':
                return ['windows', 'zip', 'extractZip', `${name}.exe`];
            default:
                throw new Error(`Unexpected OS ${platform}`);
        }
    })();

    const url = `https://github.com/aliyun/aliyun-cli/releases/download/v${version}/aliyun-cli-${system}-${version}-amd64.${ext}`;
    const downloadedPath = await tc.downloadTool(url);
    const extractedPath = await tc[extractFunc](downloadedPath);

    fs.copyFileSync(path.normalize(`${extractedPath}/aliyun.exe`), path.normalize(`${extractedPath}/aliyun`))

    const cachedPath = await tc.cacheDir(extractedPath, name, version);
    core.addPath(cachedPath);

    const args = ['configure', 'set'];
    for (const config of configs) {
        if (config.value.length > 0) {
            args.push(config.flag, config.value);
        }
    }

    await exec.exec(executable, args);
}

run().catch(function (e) {
    core.setFailed(`Action failed with error: ${e}`);
});

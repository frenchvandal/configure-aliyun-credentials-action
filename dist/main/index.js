Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = require("path");
const promises_1 = require("fs/promises");
const core_1 = require("@actions/core");
const credentials_1 = tslib_1.__importStar(require("@alicloud/credentials"));
const ROLE_SESSION_NAME = (0, core_1.getInput)('role-session-name', { required: false });
const roleToAssume = (0, core_1.getInput)('role-to-assume', { required: false });
const oidcProviderArn = (0, core_1.getInput)('oidc-provider-arn');
const roleSessionExpiration = (0, core_1.getInput)('role-session-expiration', { required: false });
const roleChainingInput = (0, core_1.getInput)('role-chaining', { required: false });
const roleChaining = roleChainingInput === 'true';
function setCredentialsOutput(accessKeyId, accessKeySecret, securityToken) {
    (0, core_1.setSecret)(accessKeyId);
    (0, core_1.setSecret)(accessKeySecret);
    (0, core_1.setSecret)(securityToken);
    (0, core_1.setOutput)('aliyun-access-key-id', accessKeyId);
    (0, core_1.setOutput)('aliyun-access-key-secret', accessKeySecret);
    (0, core_1.setOutput)('aliyun-security-token', securityToken);
    // use standard environment variables
    (0, core_1.exportVariable)('ALIBABA_CLOUD_ACCESS_KEY_ID', accessKeyId);
    (0, core_1.exportVariable)('ALIBABA_CLOUD_ACCESS_KEY_SECRET', accessKeySecret);
    (0, core_1.exportVariable)('ALIBABA_CLOUD_SECURITY_TOKEN', securityToken);
    (0, core_1.exportVariable)('ALICLOUD_ACCESS_KEY', accessKeyId);
    (0, core_1.exportVariable)('ALICLOUD_SECRET_KEY', accessKeySecret);
    (0, core_1.exportVariable)('ALICLOUD_SECURITY_TOKEN', securityToken);
    // keep it for compatibility
    (0, core_1.exportVariable)('ALIBABACLOUD_ACCESS_KEY_ID', accessKeyId);
    (0, core_1.exportVariable)('ALIBABACLOUD_ACCESS_KEY_SECRET', accessKeySecret);
    (0, core_1.exportVariable)('ALIBABACLOUD_SECURITY_TOKEN', securityToken);
}
async function run() {
    // Scenario 1: Role Chaining — use existing env credentials to assume another role
    if (roleChaining) {
        if (!roleToAssume) {
            throw new Error("'role-to-assume' must be provided if 'role-chaining' is provided");
        }
        const provider = credentials_1.RAMRoleARNCredentialsProvider.builder()
            .withCredentialsProvider(credentials_1.EnvironmentVariableCredentialsProvider.builder().build())
            .withRoleArn(roleToAssume)
            .withRoleSessionName(ROLE_SESSION_NAME)
            .withDurationSeconds(Number(roleSessionExpiration))
            .build();
        const cred = new credentials_1.default(null, provider);
        const { accessKeyId, accessKeySecret, securityToken } = (await cred.getCredential());
        setCredentialsOutput(accessKeyId, accessKeySecret, securityToken);
        return;
    }
    // Scenario 2: OIDC Role Assumption
    if (roleToAssume && oidcProviderArn) {
        const audience = (0, core_1.getInput)('audience');
        const idToken = await (0, core_1.getIDToken)(audience);
        const oidcTokenFilePath = (0, path_1.join)(os_1.default.tmpdir(), 'token');
        // write into token file
        await (0, promises_1.writeFile)(oidcTokenFilePath, idToken);
        const config = new credentials_1.Config({
            type: 'oidc_role_arn',
            roleArn: roleToAssume,
            oidcProviderArn,
            oidcTokenFilePath,
            roleSessionExpiration: Number(roleSessionExpiration),
            roleSessionName: ROLE_SESSION_NAME,
        });
        const client = new credentials_1.default(config);
        const { accessKeyId, accessKeySecret, securityToken } = (await client.getCredential());
        setCredentialsOutput(accessKeyId, accessKeySecret, securityToken);
        return;
    }
    // Scenario 3 & 4: ECS RAM Role (with or without role assumption)
    const ecsConfig = new credentials_1.Config({ type: 'ecs_ram_role' });
    const ecsClient = new credentials_1.default(ecsConfig);
    const { accessKeyId: ecsKeyId, accessKeySecret: ecsKeySecret, securityToken: ecsToken, } = (await ecsClient.getCredential());
    if (roleToAssume) {
        // Scenario 3: use ECS credentials to assume another role
        const ramConfig = new credentials_1.Config({
            type: 'ram_role_arn',
            accessKeyId: ecsKeyId,
            accessKeySecret: ecsKeySecret,
            securityToken: ecsToken,
            roleArn: roleToAssume,
            roleSessionExpiration: Number(roleSessionExpiration),
            roleSessionName: ROLE_SESSION_NAME,
        });
        const ramCred = new credentials_1.default(ramConfig);
        const { accessKeyId, accessKeySecret, securityToken } = (await ramCred.getCredential());
        setCredentialsOutput(accessKeyId, accessKeySecret, securityToken);
        return;
    }
    // Scenario 4: use ECS credentials directly
    setCredentialsOutput(ecsKeyId, ecsKeySecret, ecsToken);
}
if (require.main === module) {
    run().catch((err) => {
        console.log(err.stack);
        (0, core_1.setFailed)(err.message);
    });
}
//# sourceMappingURL=index.js.map

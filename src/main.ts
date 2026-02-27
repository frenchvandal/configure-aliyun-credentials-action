import os from 'os';
import { join } from 'path';
import { writeFile } from 'fs/promises';

import { exportVariable, getIDToken, getInput, setFailed, setOutput, setSecret } from '@actions/core';
import CredentialClient, {
  Config,
  RAMRoleARNCredentialsProvider,
  EnvironmentVariableCredentialsProvider,
} from '@alicloud/credentials';

interface Credential {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
}

const ROLE_SESSION_NAME = getInput('role-session-name', { required: false });
const roleToAssume = getInput('role-to-assume', { required: false });
const oidcProviderArn = getInput('oidc-provider-arn');
const roleSessionExpiration = getInput('role-session-expiration', { required: false });
const roleChainingInput = getInput('role-chaining', { required: false });
const roleChaining = roleChainingInput === 'true';

function setCredentialsOutput(accessKeyId: string, accessKeySecret: string, securityToken: string): void {
  setSecret(accessKeyId);
  setSecret(accessKeySecret);
  setSecret(securityToken);
  setOutput('aliyun-access-key-id', accessKeyId);
  setOutput('aliyun-access-key-secret', accessKeySecret);
  setOutput('aliyun-security-token', securityToken);
  // use standard environment variables
  exportVariable('ALIBABA_CLOUD_ACCESS_KEY_ID', accessKeyId);
  exportVariable('ALIBABA_CLOUD_ACCESS_KEY_SECRET', accessKeySecret);
  exportVariable('ALIBABA_CLOUD_SECURITY_TOKEN', securityToken);
  exportVariable('ALICLOUD_ACCESS_KEY', accessKeyId);
  exportVariable('ALICLOUD_SECRET_KEY', accessKeySecret);
  exportVariable('ALICLOUD_SECURITY_TOKEN', securityToken);
  // keep it for compatibility
  exportVariable('ALIBABACLOUD_ACCESS_KEY_ID', accessKeyId);
  exportVariable('ALIBABACLOUD_ACCESS_KEY_SECRET', accessKeySecret);
  exportVariable('ALIBABACLOUD_SECURITY_TOKEN', securityToken);
}

export async function run(): Promise<void> {
  // Scenario 1: Role Chaining — use existing env credentials to assume another role
  if (roleChaining) {
    if (!roleToAssume) {
      throw new Error("'role-to-assume' must be provided if 'role-chaining' is provided");
    }

    const provider = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(EnvironmentVariableCredentialsProvider.builder().build())
      .withRoleArn(roleToAssume)
      .withRoleSessionName(ROLE_SESSION_NAME)
      .withDurationSeconds(Number(roleSessionExpiration))
      .build();

    const cred = new CredentialClient(null, provider);
    const { accessKeyId, accessKeySecret, securityToken } = (await cred.getCredential()) as Credential;
    setCredentialsOutput(accessKeyId, accessKeySecret, securityToken);
    return;
  }

  // Scenario 2: OIDC Role Assumption
  if (roleToAssume && oidcProviderArn) {
    const audience = getInput('audience');
    const idToken = await getIDToken(audience);
    console.log(idToken);
    const oidcTokenFilePath = join(os.tmpdir(), 'token');
    // write into token file
    await writeFile(oidcTokenFilePath, idToken);

    const config = new Config({
      type: 'oidc_role_arn',
      roleArn: roleToAssume,
      oidcProviderArn,
      oidcTokenFilePath,
      roleSessionExpiration: Number(roleSessionExpiration),
      roleSessionName: ROLE_SESSION_NAME,
    });
    const client = new CredentialClient(config);
    const { accessKeyId, accessKeySecret, securityToken } = (await client.getCredential()) as Credential;
    setCredentialsOutput(accessKeyId, accessKeySecret, securityToken);
    return;
  }

  // Scenario 3 & 4: ECS RAM Role (with or without role assumption)
  const ecsConfig = new Config({ type: 'ecs_ram_role' });
  const ecsClient = new CredentialClient(ecsConfig);
  const {
    accessKeyId: ecsKeyId,
    accessKeySecret: ecsKeySecret,
    securityToken: ecsToken,
  } = (await ecsClient.getCredential()) as Credential;

  if (roleToAssume) {
    // Scenario 3: use ECS credentials to assume another role
    const ramConfig = new Config({
      type: 'ram_role_arn',
      accessKeyId: ecsKeyId,
      accessKeySecret: ecsKeySecret,
      securityToken: ecsToken,
      roleArn: roleToAssume,
      roleSessionExpiration: Number(roleSessionExpiration),
      roleSessionName: ROLE_SESSION_NAME,
    });
    const ramCred = new CredentialClient(ramConfig);
    const { accessKeyId, accessKeySecret, securityToken } = (await ramCred.getCredential()) as Credential;
    setCredentialsOutput(accessKeyId, accessKeySecret, securityToken);
    return;
  }

  // Scenario 4: use ECS credentials directly
  setCredentialsOutput(ecsKeyId, ecsKeySecret, ecsToken);
}

run().catch((err: Error) => {
  console.log(err.stack);
  setFailed(err.message);
});

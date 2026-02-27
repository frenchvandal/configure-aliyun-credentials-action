import {exportVariable} from '@actions/core';

// use standard environment variables
exportVariable('ALIBABA_CLOUD_ACCESS_KEY_ID', '');
exportVariable('ALIBABA_CLOUD_ACCESS_KEY_SECRET', '');
exportVariable('ALIBABA_CLOUD_SECURITY_TOKEN', '');
// keep it for compatibility
exportVariable('ALIBABACLOUD_ACCESS_KEY_ID', '');
exportVariable('ALIBABACLOUD_ACCESS_KEY_SECRET', '');
exportVariable('ALIBABACLOUD_SECURITY_TOKEN', '');
// keep it for terraform oss backend support https://developer.hashicorp.com/terraform/language/backend/oss
exportVariable('ALICLOUD_ACCESS_KEY', '');
exportVariable('ALICLOUD_SECRET_KEY', '');
exportVariable('ALICLOUD_SECURITY_TOKEN', '');

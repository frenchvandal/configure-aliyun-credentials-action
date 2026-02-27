Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
// use standard environment variables
(0, core_1.exportVariable)('ALIBABA_CLOUD_ACCESS_KEY_ID', '');
(0, core_1.exportVariable)('ALIBABA_CLOUD_ACCESS_KEY_SECRET', '');
(0, core_1.exportVariable)('ALIBABA_CLOUD_SECURITY_TOKEN', '');
// keep it for compatibility
(0, core_1.exportVariable)('ALIBABACLOUD_ACCESS_KEY_ID', '');
(0, core_1.exportVariable)('ALIBABACLOUD_ACCESS_KEY_SECRET', '');
(0, core_1.exportVariable)('ALIBABACLOUD_SECURITY_TOKEN', '');
// keep it for terraform oss backend support https://developer.hashicorp.com/terraform/language/backend/oss
(0, core_1.exportVariable)('ALICLOUD_ACCESS_KEY', '');
(0, core_1.exportVariable)('ALICLOUD_SECRET_KEY', '');
(0, core_1.exportVariable)('ALICLOUD_SECURITY_TOKEN', '');
//# sourceMappingURL=index.js.map

import { BuildType } from './types.ts';

export const baseUrls = {
  [BuildType.PRODUCTION]: 'https://apigw.okto.tech',
  [BuildType.STAGING]: 'https://3p-bff.oktostage.com',
  [BuildType.SANDBOX]: 'https://sandbox-api.okto.tech',
};

export const JOB_RETRY_INTERVAL = 5000; //5s
export const JOB_MAX_RETRY = 12; //retry for 60s (12 * 5 = 60)
import axios, { type AxiosInstance } from 'axios';
import * as Types from './types.ts';
import { BuildType } from './types.ts';
import {
  baseUrls,
  JOB_MAX_RETRY,
  JOB_RETRY_INTERVAL,
} from './constants.ts';

export function getQueryString(query: any) {
  const queryParams: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      queryParams.push(`${key}=${value}`);
    }
  }
  const queryString = queryParams.join('&');
  return queryString;
}

export class OktoWallet {
  private apiKey: string = '';
  private baseUrl: string = '';
  private axiosInstance: AxiosInstance | null = null;
  private authDetails: Types.AuthDetails | null = null;
  private idToken: string = '';
  private buildType: BuildType = BuildType.SANDBOX;

  isLoggedIn(): boolean {
    return this.authDetails != null;
  }

  getAuthToken(): string | undefined {
    return this.authDetails?.authToken;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getIdToken(): string {
    return this.idToken;
  }

  async init(
    apiKey: string, 
    buildType: BuildType = BuildType.SANDBOX, 
    authDetails: Types.AuthDetails | null = null
  ) {
    this.apiKey = apiKey;
    this.buildType = buildType;
    this.baseUrl = baseUrls[buildType];
    this.authDetails = authDetails;

    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/api`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
    });

    // Request Interceptor to add Auth tokens to every request
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.authDetails?.authToken) {
          config.headers.Authorization = `Bearer ${this.authDetails.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle 401 errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401) {
          try {
            const newAuthDetails = await this.refreshToken(); // Attempt to refresh token
            if (newAuthDetails) {
              // Update the Authorization header with the new access token
              originalRequest.headers.Authorization = `Bearer ${newAuthDetails.authToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Handle refresh token errors
            this.updateAuthDetails(null); // Clear auth details if refresh fails
            return Promise.reject(refreshError);
          }
        }
        // Return the Promise rejection if refresh didn't work or error is not due to 401
        this.updateAuthDetails(null);
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<Types.AuthDetails | null> {
    if (this.authDetails) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/v1/refresh_token`,
          {},
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${this.authDetails.authToken}`,
              'x-refresh-authorization': `Bearer ${this.authDetails.refreshToken}`,
              'x-device-token': this.authDetails.deviceToken,
              'x-api-key': this.apiKey,
            },
          }
        );
        const authDetails: Types.AuthDetails = {
          authToken: response.data.data.auth_token,
          refreshToken: response.data.data.refresh_auth_token,
          deviceToken: response.data.data.device_token,
        };

        this.updateAuthDetails(authDetails);
        return authDetails;
      } catch (error) {
        throw new Error('Failed to refresh token');
      }
    }
    return null;
  }

  async authenticate(
    idToken: string,
    callback: (result: boolean, error: Error | null) => void
  ) {
    if (!this.axiosInstance) {
      return callback(false, new Error('SDK is not initialized'));
    }

    this.idToken = idToken;

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v2/authenticate`,
        {
          id_token: idToken,
        },
        {
          headers: {
            'Accept': '*/*',
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (
        response.status === 200 &&
        response.data &&
        response.data.status === 'success'
      ) {
        if (response.data.data.auth_token) {
          const authDetails: Types.AuthDetails = {
            authToken: response.data.data.auth_token,
            refreshToken: response.data.data.refresh_auth_token,
            deviceToken: response.data.data.device_token,
          };
          this.updateAuthDetails(authDetails);
          callback(response.data.data, null);
        } else {
          callback(response.data.data, new Error('No auth token found'));
        }
      } else {
        callback(false, new Error('Server responded with an error'));
      }
    } catch (error: any) {
      callback(false, error);
    }
  }

  async authenticateWithUserId(
    userId: string,
    jwtToken: string,
    callback: (result: boolean, error: Error | null) => void
  ) {
    if (!this.axiosInstance) {
      return callback(false, new Error('SDK is not initialized'));
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/jwt-authenticate`,
        {
          user_id: userId,
          auth_token: jwtToken,
        },
        {
          headers: {
            'Accept': '*/*',
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (
        response.status === 200 &&
        response.data &&
        response.data.status === 'success'
      ) {
        const authDetailsNew: Types.AuthDetails = {
          authToken: response.data.data.auth_token,
          refreshToken: response.data.data.refresh_auth_token,
          deviceToken: response.data.data.device_token,
        };
        this.updateAuthDetails(authDetailsNew);
        callback(response.data.data, null);
      } else {
        callback(false, new Error('Server responded with an error'));
      }
    } catch (error: any) {
      callback(false, error);
    }
  }

  async logOut() {
    await this.updateAuthDetails(null);
  }

  async updateAuthDetails(authDetails: Types.AuthDetails | null) {
    this.authDetails = authDetails;
  }

  async makeGetRequest<T>(
    endpoint: string,
    queryUrl: string | null = null
  ): Promise<T> {
    if (!this.axiosInstance) {
      throw new Error('SDK is not initialized');
    }

    const url = queryUrl ? `${endpoint}?${queryUrl}` : endpoint;
    try {
      const response = await this.axiosInstance.get<Types.ApiResponse<T>>(url);
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  async getPortfolio(): Promise<Types.PortfolioData> {
    return this.makeGetRequest<Types.PortfolioData>('/v1/portfolio');
  }

  async getSupportedTokens(): Promise<Types.TokensData> {
    return this.makeGetRequest<Types.TokensData>('/v1/supported/tokens');
  }

  async getSupportedNetworks(): Promise<Types.NetworkData> {
    return this.makeGetRequest<Types.NetworkData>('/v1/supported/networks');
  }

  async getUserDetails(): Promise<Types.User> {
    return this.makeGetRequest<Types.User>('/v1/user_from_token');
  }

  async getWallets(): Promise<Types.WalletData> {
    return this.makeGetRequest<Types.WalletData>('/v1/widget/wallet');
  }

  async orderHistory(
    query: Partial<Types.OrderQuery>
  ): Promise<Types.OrderData> {
    const queryString = getQueryString(query);
    return this.makeGetRequest<Types.OrderData>('/v1/orders', queryString);
  }

  async getNftOrderDetails(
    query: Partial<Types.NftOrderDetailsQuery>
  ): Promise<Types.NftOrderDetailsData> {
    const queryString = getQueryString(query);
    return this.makeGetRequest<Types.NftOrderDetailsData>(
      '/v1/nft/order_details',
      queryString
    );
  }

  async getRawTransactionStatus(
    query: Types.RawTransactionStatusQuery
  ): Promise<Types.RawTransactionStatusData> {
    const queryString = getQueryString(query);
    return this.makeGetRequest<Types.RawTransactionStatusData>(
      '/v1/rawtransaction/status',
      queryString
    );
  }

  async makePostRequest<T>(endpoint: string, data: any = null): Promise<T> {
    if (!this.axiosInstance) {
      throw new Error('SDK is not initialized');
    }

    try {
      const response = await this.axiosInstance.post<Types.ApiResponse<T>>(
        endpoint,
        data
      );
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  async createWallet(): Promise<Types.WalletData> {
    return this.makePostRequest<Types.WalletData>('/v1/wallet');
  }

  async transferTokens(
    data: Types.TransferTokens
  ): Promise<Types.TransferTokensData> {
    console.log("PAYLOAD", data)
    return this.makePostRequest<Types.TransferTokensData>(
      '/v1/transfer/tokens/execute',
      data
    );
  }

  async transferTokensWithJobStatus(
    data: Types.TransferTokens
  ): Promise<Types.Order> {
    try {
      const { orderId } = await this.transferTokens(data);

      return await this.waitForJobCompletion<Types.Order>(
        orderId,
        async (_orderId: string) => {
          const orderData = await this.orderHistory({ order_id: _orderId });
          const order = orderData.jobs.find(
            (item) => item.order_id === _orderId
          );
          if (
            order &&
            (order.status === Types.OrderStatus.SUCCESS ||
              order.status === Types.OrderStatus.FAILED)
          ) {
            return order;
          }
          throw new Error(
            `Order with ID ${_orderId} not found or not completed.`
          );
        }
      );
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  async transferNft(data: Types.TransferNft): Promise<Types.TransferNftData> {
    return this.makePostRequest<Types.TransferNftData>(
      '/v1/nft/transfer',
      data
    );
  }

  async transferNftWithJobStatus(
    data: Types.TransferNft
  ): Promise<Types.NftOrderDetails> {
    try {
      const { order_id } = await this.transferNft(data);

      return await this.waitForJobCompletion<Types.NftOrderDetails>(
        order_id,
        async (orderId: string) => {
          const orderData = await this.getNftOrderDetails({
            order_id: orderId,
          });
          const order = orderData.nfts.find((item) => item.id === orderId);
          if (order) {
            return order;
          }
          throw new Error(
            `Order with ID ${orderId} not found or not completed.`
          );
        }
      );
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  async executeRawTransaction(
    data: Types.ExecuteRawTransaction
  ): Promise<Types.ExecuteRawTransactionData> {
    return this.makePostRequest<Types.ExecuteRawTransactionData>(
      '/v1/rawtransaction/execute',
      data
    );
  }

  async executeRawTransactionWithJobStatus(
    data: Types.ExecuteRawTransaction
  ): Promise<Types.RawTransactionStatus> {
    try {
      const { jobId } = await this.executeRawTransaction(data);

      return await this.waitForJobCompletion<Types.RawTransactionStatus>(
        jobId,
        async (orderId: string) => {
          const orderData = await this.getRawTransactionStatus({
            order_id: orderId,
          });
          const order = orderData.jobs.find(
            (item) => item.order_id === orderId
          );
          if (
            order &&
            (order.status === Types.OrderStatus.SUCCESS ||
              order.status === Types.OrderStatus.FAILED)
          ) {
            return order;
          }
          throw new Error(
            `Order with ID ${orderId} not found or not completed.`
          );
        }
      );
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  async waitForJobCompletion<T>(
    orderId: string,
    findJobCallback: (orderId: string) => Promise<T>
  ): Promise<T> {
    console.log("Order Submitted: ", orderId)
    for (let retryCount = 0; retryCount < JOB_MAX_RETRY; retryCount++) {
      try {
        return await findJobCallback(orderId);
      } catch (error) {}
      console.log("Waiting for Job Completion: ", orderId)
      await this.delay(JOB_RETRY_INTERVAL);
    }
    throw new Error(
      `Order with ID ${orderId} not found or not completed after ${JOB_MAX_RETRY * (JOB_RETRY_INTERVAL / 1000)} seconds. Returning failure.`
    );
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getBuildType(): BuildType {
    return this.buildType;
  }

  async readContractData(
    network_name: string,
    data: any,
  ): Promise<any> {
    return this.makePostRequest<any>('/v1/readContractData', {
      network_name,
      data,
    });
  }
}


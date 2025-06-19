import axios from 'axios';

interface UniPhiAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface UniPhiProject {
  id: string;
  name: string;
  [key: string]: any; // To allow for additional properties
}

// OAuth configuration
const OAUTH_CONFIG = {
  tokenUrl: 'https://bluechp.uniphi.com.au/oauth/token',
  apiBaseUrl: 'https://bluechp.uniphi.com.au/api'
}

class UniPhiApiClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Get an authentication token from the UniPhi API using OAuth
   */
  private async authenticate(): Promise<void> {
    try {
      // Check if we already have a valid token
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return;
      }

      console.log('Attempting to authenticate with UniPhi API using OAuth...');
      
      try {
        // Approach 1: Basic auth header for OAuth client credentials flow
        const authHeader = `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`;
        
        // Attempt OAuth token request with client credentials grant
        const response = await axios.post<UniPhiAuthResponse>(
          OAUTH_CONFIG.tokenUrl,
          new URLSearchParams({
            grant_type: 'client_credentials',
          }),
          {
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
          }
        );
        
        this.accessToken = response.data.access_token;
        
        // Set token expiry (typically 1 hour minus 5 minutes for safety)
        const expiresInMs = (response.data.expires_in - 300) * 1000;
        this.tokenExpiry = new Date(Date.now() + expiresInMs);
        
        console.log('UniPhi API authentication successful (Method 1)');
      } catch (authError) {
        console.log('First authentication method failed, trying alternative approach...');
        
        // Approach 2: Include credentials in the form body (some OAuth servers prefer this)
        const response = await axios.post<UniPhiAuthResponse>(
          OAUTH_CONFIG.tokenUrl,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
          }
        );
        
        this.accessToken = response.data.access_token;
        
        // Set token expiry (typically 1 hour minus 5 minutes for safety)
        const expiresInMs = (response.data.expires_in - 300) * 1000;
        this.tokenExpiry = new Date(Date.now() + expiresInMs);
        
        console.log('UniPhi API authentication successful (Method 2)');
      }
    } catch (error) {
      console.error('Error authenticating with UniPhi API:', error);
      throw new Error('Failed to authenticate with UniPhi API');
    }
  }

  /**
   * Get projects from the UniPhi API
   */
  async getProjects(): Promise<UniPhiProject[]> {
    await this.authenticate();
    
    try {
      console.log('Fetching projects from UniPhi API...');
      
      const response = await axios.get<UniPhiProject[]>(`${OAUTH_CONFIG.apiBaseUrl}/projects`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json'
        },
      });
      
      console.log(`Successfully fetched ${response.data.length} projects from UniPhi API`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects from UniPhi API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw new Error(`Failed to fetch projects from UniPhi API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: string): Promise<UniPhiProject> {
    await this.authenticate();
    
    try {
      console.log(`Fetching project ${projectId} from UniPhi API...`);
      
      const response = await axios.get<UniPhiProject>(`${OAUTH_CONFIG.apiBaseUrl}/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json'
        },
      });
      
      console.log(`Successfully fetched project ${projectId} from UniPhi API`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${projectId} from UniPhi API:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw new Error(`Failed to fetch project ${projectId} from UniPhi API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Create and export a singleton instance with the provided credentials
export const uniphiApiClient = new UniPhiApiClient(
  '3149fa20-1483-4c93-99e5-6b45753ba0de',
  'vwZHhF8Z00BPY0CFRiZ9/ZxjNukgcfBkjiDKzHxq6eau6BV/PStBUogYdJkKwxvZ'
);

export default uniphiApiClient;
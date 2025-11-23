import { executeCalComFunction } from './calcomService.js';
import axios from 'axios';

/**
 * Execute a function based on agent configuration
 */
export async function executeFunction(agent, functionName, parameters) {
  try {
    // Find the function in agent's configuration (trim both names for comparison)
    const functionConfig = agent.functions?.find(f => f.name?.trim() === functionName?.trim());

    if (!functionConfig) {
      throw new Error(`Function ${functionName} not found in agent configuration`);
    }

    // Validate required parameters
    if (functionConfig.parameters) {
      for (const param of functionConfig.parameters) {
        if (param.required && !parameters[param.name]) {
          throw new Error(`Missing required parameter: ${param.name}`);
        }
      }
    }

    // Execute based on function type
    if (functionConfig.type === 'cal_com') {
      return await executeCalComFunction(functionConfig, parameters);
    } else if (functionConfig.type === 'custom') {
      return await executeCustomFunction(functionConfig, parameters);
    }

    throw new Error(`Unknown function type: ${functionConfig.type}`);
  } catch (error) {
    console.error('Function execution error:', error);
    throw error;
  }
}

/**
 * Execute custom API function
 */
async function executeCustomFunction(functionConfig, parameters) {
  try {
    const { method, url, headers, bodyTemplate } = functionConfig;

    // Replace parameters in URL
    let finalUrl = url;
    Object.entries(parameters).forEach(([key, value]) => {
      finalUrl = finalUrl.replace(`{${key}}`, encodeURIComponent(value));
      finalUrl = finalUrl.replace(`\${${key}}`, encodeURIComponent(value));
    });

    // Prepare headers
    const finalHeaders = {};
    if (headers && Array.isArray(headers)) {
      headers.forEach(header => {
        if (header.key && header.value) {
          let headerValue = header.value;
          // Replace parameters in header values
          Object.entries(parameters).forEach(([key, value]) => {
            headerValue = headerValue.replace(`{${key}}`, value);
            headerValue = headerValue.replace(`\${${key}}`, value);
          });
          finalHeaders[header.key] = headerValue;
        }
      });
    }

    // Prepare request body
    let finalBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && bodyTemplate) {
      try {
        let bodyString = typeof bodyTemplate === 'string' 
          ? bodyTemplate 
          : JSON.stringify(bodyTemplate);

        // Replace parameters in body
        Object.entries(parameters).forEach(([key, value]) => {
          bodyString = bodyString.replace(`{${key}}`, JSON.stringify(value));
          bodyString = bodyString.replace(`\${${key}}`, JSON.stringify(value));
        });

        finalBody = JSON.parse(bodyString);
      } catch (error) {
        console.error('Body template parsing error:', error);
        finalBody = bodyTemplate;
      }
    }

    // Execute request
    const response = await axios({
      method: method.toLowerCase(),
      url: finalUrl,
      headers: {
        'Content-Type': 'application/json',
        ...finalHeaders
      },
      ...(finalBody && { data: finalBody }),
      timeout: 30000 // 30 second timeout
    });

    return {
      success: true,
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Custom function execution error:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

export default {
  executeFunction
};

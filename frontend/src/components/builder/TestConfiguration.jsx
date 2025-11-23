import { Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TestConfiguration = ({ twilioConfig, onChange }) => {
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);
  const [numbersLoading, setNumbersLoading] = useState(true);
  const [existingNumbers, setExistingNumbers] = useState([]);
  const [useExisting, setUseExisting] = useState(false);
  const [selectedNumberId, setSelectedNumberId] = useState('');

  const updateConfig = (key, value) => {
    onChange({
      ...twilioConfig,
      [key]: value
    });
  };

  // Fetch user's saved phone numbers for dropdown
  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/phone-numbers');
        setExistingNumbers(res.data || []);
      } catch (err) {
        console.error('Fetch phone numbers error:', err);
      } finally {
        setNumbersLoading(false);
      }
    };
    fetchNumbers();
  }, []);

  const handleSelectExisting = (id) => {
    setSelectedNumberId(id);
    const item = existingNumbers.find((n) => n.id === id);
    if (!item) return;
    let tc = item.twilio_config;
    if (typeof tc === 'string') {
      try { tc = JSON.parse(tc); } catch { tc = null; }
    }
    if (!tc) {
      toast.error('Selected number has no Twilio config');
      return;
    }
    onChange({
      ...twilioConfig,
      accountSid: tc.accountSid || '',
      authToken: tc.authToken || '',
      phoneNumber: tc.phoneNumber || ''
    });
  };

  const handleValidate = async () => {
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber) {
      toast.error('Please fill in all Twilio credentials');
      return;
    }

    setValidating(true);
    setValidationStatus(null);

    try {
      const response = await axios.post('http://localhost:3000/api/twilio/validate', {
        accountSid: twilioConfig.accountSid,
        authToken: twilioConfig.authToken,
        phoneNumber: twilioConfig.phoneNumber
      });

      if (response.data.valid) {
        setValidationStatus('valid');
        toast.success('Twilio credentials validated successfully!');
      } else {
        setValidationStatus('invalid');
        toast.error(response.data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus('invalid');
      toast.error(error.response?.data?.message || 'Failed to validate credentials');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Testing Configuration</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure Twilio to test your voice agent with real phone calls
        </p>
      </div>

      <div className="space-y-6">
        {/* Existing Numbers Selection */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <label className="block text-sm font-medium mb-2">Use existing phone number</label>
              {numbersLoading ? (
                <p className="text-sm text-gray-500">Loading your saved numbers...</p>
              ) : existingNumbers.length === 0 ? (
                <p className="text-sm text-gray-500">No saved numbers. Add one in <a href="/phone-numbers" className="underline">Phone Numbers</a>.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="useExisting"
                      type="checkbox"
                      checked={useExisting}
                      onChange={(e) => setUseExisting(e.target.checked)}
                    />
                    <label htmlFor="useExisting" className="text-sm">Select from your saved numbers</label>
                  </div>
                  {useExisting && (
                    <select
                      className="input-field"
                      value={selectedNumberId}
                      onChange={(e) => handleSelectExisting(e.target.value)}
                    >
                      <option value="">Select a number...</option>
                      {existingNumbers.map((n) => {
                        const label = n.label ? `${n.label} – ${n.phone_number}` : n.phone_number;
                        return (
                          <option key={n.id} value={n.id}>{label}</option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}
            </div>
            <a href="/phone-numbers" className="text-sm underline text-gray-600">Manage</a>
          </div>
        </div>

        {/* Info Alert */}
        <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                Twilio Testing Setup
              </p>
              <p className="text-purple-700 dark:text-purple-300">
                You'll need a Twilio account to test voice calls. Get your credentials from{' '}
                <a
                  href="https://console.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Twilio Console
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Twilio Account SID */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Twilio Account SID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={twilioConfig.accountSid}
            onChange={(e) => updateConfig('accountSid', e.target.value)}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="input-field font-mono text-sm"
            disabled={useExisting}
          />
        </div>

        {/* Twilio Auth Token */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Twilio Auth Token <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={twilioConfig.authToken}
            onChange={(e) => updateConfig('authToken', e.target.value)}
            placeholder="Your auth token"
            className="input-field font-mono text-sm"
            disabled={useExisting}
          />
        </div>

        {/* Twilio Phone Number */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Twilio Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={twilioConfig.phoneNumber}
            onChange={(e) => updateConfig('phoneNumber', e.target.value)}
            placeholder="+1234567890"
            className="input-field"
            disabled={useExisting}
          />
          <p className="text-xs text-gray-500 mt-1">
            The phone number from which test calls will be made (format: +1234567890)
          </p>
        </div>

        {/* Validate Button */}
        <button
          onClick={handleValidate}
          disabled={validating}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {validating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Validating...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Validate Credentials</span>
            </>
          )}
        </button>

        {/* Validation Status */}
        {validationStatus && (
          <div
            className={`card ${
              validationStatus === 'valid'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              {validationStatus === 'valid' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Credentials Validated
                    </p>
                    <p className="text-green-700 dark:text-green-300">
                      Your Twilio configuration is correct and ready to use
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div className="text-sm">
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Validation Failed
                    </p>
                    <p className="text-red-700 dark:text-red-300">
                      Please check your credentials and try again
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Test Phone Number */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <label className="block text-sm font-medium mb-2">
            Test Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={twilioConfig.testPhone}
            onChange={(e) => updateConfig('testPhone', e.target.value)}
            placeholder="+1234567890"
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">
            The phone number to call for testing (you can set this later)
          </p>
        </div>

        {/* Security Note */}
        <div className="card bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">Security Note</p>
              <p>
                Your Twilio credentials are encrypted and stored securely. They are only used 
                to initiate test calls for your agents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConfiguration;


import { useState, useEffect } from 'react';

const REFERRAL_KEY = 'token_referral';
const REFERRAL_PARAM = 'ref';

export interface ReferralData {
  referrer: string | null;
  timestamp: number;
}

export const useReferral = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);

  // Check for referral parameter in URL and save to localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralParam = urlParams.get(REFERRAL_PARAM);

    if (referralParam && isValidAddress(referralParam)) {
      const newReferralData: ReferralData = {
        referrer: referralParam,
        timestamp: Date.now()
      };
      
      localStorage.setItem(REFERRAL_KEY, JSON.stringify(newReferralData));
      setReferralData(newReferralData);
      
      // Clean URL without page reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else {
      // Load existing referral data from localStorage
      const stored = localStorage.getItem(REFERRAL_KEY);
      if (stored) {
        try {
          const parsedData: ReferralData = JSON.parse(stored);
          // Check if referral data is not older than 30 days
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          if (parsedData.timestamp > thirtyDaysAgo) {
            setReferralData(parsedData);
          } else {
            // Remove expired referral data
            localStorage.removeItem(REFERRAL_KEY);
          }
        } catch (error) {
          console.error('Error parsing referral data:', error);
          localStorage.removeItem(REFERRAL_KEY);
        }
      }
    }
  }, []);

  const clearReferral = () => {
    localStorage.removeItem(REFERRAL_KEY);
    setReferralData(null);
  };

  const setReferrer = (referrerAddress: string) => {
    if (isValidAddress(referrerAddress)) {
      const newReferralData: ReferralData = {
        referrer: referrerAddress,
        timestamp: Date.now()
      };
      
      localStorage.setItem(REFERRAL_KEY, JSON.stringify(newReferralData));
      setReferralData(newReferralData);
    }
  };

  const generateReferralLink = (baseUrl: string, userAddress: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set(REFERRAL_PARAM, userAddress);
    return url.toString();
  };

  return {
    referralData,
    referrer: referralData?.referrer || null,
    hasReferrer: !!referralData?.referrer,
    clearReferral,
    setReferrer,
    generateReferralLink
  };
};

// Helper function to validate Ethereum address
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
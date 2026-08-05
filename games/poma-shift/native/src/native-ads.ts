import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';

type AdConfig = {
  testing: boolean;
  androidRewarded: string;
  androidInterstitial: string;
  iosRewarded: string;
  iosInterstitial: string;
};

declare const __POMA_AD_CONFIG__: AdConfig;

declare global {
  interface Window {
    PomaShiftAds?: {
      native?: boolean;
      testMode?: boolean;
      rewarded: (placement?: string) => Promise<boolean>;
      interstitial: (placement?: string) => Promise<boolean>;
    };
  }
}

const GOOGLE_TEST_IDS = {
  android: {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
  ios: {
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
  },
};

const config = __POMA_AD_CONFIG__;
let initialized: Promise<boolean> | null = null;

function platform(): 'android' | 'ios' | 'web' {
  const current = Capacitor.getPlatform();
  if (current === 'android' || current === 'ios') return current;
  return 'web';
}

function adId(kind: 'rewarded' | 'interstitial'): string {
  const current = platform();
  if (current === 'web') return '';
  if (config.testing) return GOOGLE_TEST_IDS[current][kind];
  if (current === 'android') {
    return kind === 'rewarded' ? config.androidRewarded : config.androidInterstitial;
  }
  return kind === 'rewarded' ? config.iosRewarded : config.iosInterstitial;
}

async function initialize(): Promise<boolean> {
  if (initialized) return initialized;
  initialized = (async () => {
    if (!Capacitor.isNativePlatform()) return false;

    await AdMob.initialize({
      initializeForTesting: config.testing,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });

    try {
      let consent = await AdMob.requestConsentInfo();
      if (
        !consent.canRequestAds &&
        consent.isConsentFormAvailable &&
        consent.status === AdmobConsentStatus.REQUIRED
      ) {
        consent = await AdMob.showConsentForm();
      }
      return Boolean(consent.canRequestAds);
    } catch {
      // SDK can still request non-personalized/test inventory depending on region/config.
      return true;
    }
  })();
  return initialized;
}

async function rewarded(placement = 'rewarded'): Promise<boolean> {
  const ready = await initialize();
  const id = adId('rewarded');
  if (!ready || !id) return false;

  try {
    await AdMob.prepareRewardVideoAd({
      adId: id,
      isTesting: config.testing,
      immersiveMode: true,
      ssv: {
        customData: JSON.stringify({ placement }),
      },
    });
    const reward = await AdMob.showRewardVideoAd();
    return Boolean(reward);
  } catch {
    return false;
  }
}

async function interstitial(placement = 'level_complete'): Promise<boolean> {
  const ready = await initialize();
  const id = adId('interstitial');
  if (!ready || !id) return false;

  try {
    await AdMob.prepareInterstitial({
      adId: id,
      isTesting: config.testing,
      immersiveMode: true,
    });
    await AdMob.showInterstitial();
    void placement;
    return true;
  } catch {
    return false;
  }
}

window.PomaShiftAds = {
  native: true,
  testMode: config.testing,
  rewarded,
  interstitial,
};

void initialize();

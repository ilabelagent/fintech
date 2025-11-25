const DEFAULT_FLAGS = {
  exchange: true,
  p2p: true,
};

type FeatureFlagKey = keyof typeof DEFAULT_FLAGS;

type RemoteFlags = Partial<Record<FeatureFlagKey, boolean>>;

let remoteFlags: RemoteFlags | null = null;

function getEnvFlag(flag: FeatureFlagKey) {
  const envKey = `VITE_FEATURE_${flag.toUpperCase()}` as keyof ImportMetaEnv;
  const rawValue = import.meta.env[envKey];
  if (typeof rawValue === "string") {
    return rawValue.toLowerCase() === "true";
  }
  return undefined;
}

export function overrideFlags(flags: RemoteFlags) {
  remoteFlags = { ...remoteFlags, ...flags };
}

export function isFeatureEnabled(flag: FeatureFlagKey) {
  const envValue = getEnvFlag(flag);
  if (envValue !== undefined) return envValue;
  if (remoteFlags && remoteFlags[flag] !== undefined) return remoteFlags[flag] as boolean;
  return DEFAULT_FLAGS[flag];
}

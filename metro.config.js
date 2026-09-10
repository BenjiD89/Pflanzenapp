const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Workaround: Metro's package.json "exports" resolution mis-resolves some
// packages (e.g. @opentelemetry/api, pulled in optionally by @supabase/supabase-js)
// on Windows, appending extension-resolution logic to an already-resolved path.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile these to ensure they work with Next.js bundler
  transpilePackages: [
    "three", 
    "@react-three/drei", 
    "@react-three/fiber", 
    "troika-three-text", 
    "troika-three-utils",
    "@ricky0123/vad-react"
  ],
  webpack: (config, { isServer }) => {
    // 1. Fix the "bidi-js" and "webgl-sdf-generator" errors
    // We force webpack to use the .mjs version which has the exports Next.js expects
    config.resolve.alias = {
      ...config.resolve.alias,
      'bidi-js$': 'bidi-js/dist/bidi.mjs',
      'webgl-sdf-generator$': 'webgl-sdf-generator/dist/webgl-sdf-generator.mjs',
    };

    // 2. Ignore node-specific modules in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // 3. Silence ONNX warnings
    config.module.rules.push({
      test: /onnxruntime-web/,
      use: { loader: 'ignore-loader' },
    });

    return config;
  },
};

export default nextConfig;
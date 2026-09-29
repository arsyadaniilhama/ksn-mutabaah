/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  devIndicators: false,
  // Paket berat/tidak boleh di-bundle ke serverless function (puppeteer & chromium
  // bundled harus tetap jadi require runtime; juga mempercepat build).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "tar-fs", "exceljs", "jszip"],
  // Pastikan binary Chromium (file .br di @sparticuz/chromium/bin) ikut disertakan
  // pada fungsi yang memakai fitur ekspor PDF. Tanpa ini, file-tracing sering melewatkan
  // file .br sehingga render PDF gagal di Vercel.
  outputFileTracingIncludes: {
    "/api/export/pdf-batch/**": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
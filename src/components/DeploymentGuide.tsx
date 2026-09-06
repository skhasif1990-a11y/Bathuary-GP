import React, { useState } from 'react';
import { Rocket, Github, Globe, Server, Check, Copy, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { safeCopyToClipboard } from '../utils/safeStorage';

interface DeploymentGuideProps {
  language?: 'bn' | 'en';
}

export const DeploymentGuide: React.FC<DeploymentGuideProps> = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await safeCopyToClipboard(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const vercelJsonCode = `{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`;

  const ghActionCode = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Application
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist`;

  const dockerfileCode = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Full Deployment & Free Hosting Guide
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Step-by-step instructions to host Bathuary GP Portal for FREE on GitHub Pages, Vercel, or custom servers.
            </p>
          </div>
        </div>
      </div>

      {/* Option 1: Vercel (Recommended) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">
              Method 1: 1-Click Free Deploy on Vercel (Recommended)
            </h3>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Recommended
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Vercel offers free automatic HTTPS SSL, global fast CDN, and zero server management with zero cost.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-slate-700">
            <li>
              <strong>Push Code to GitHub:</strong>{' '}
              Create a GitHub repository and push your project code or ZIP contents.
            </li>
            <li>
              <strong>Login to Vercel:</strong>{' '}
              <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1">
                vercel.com <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and connect your GitHub account.
            </li>
            <li>
              <strong>Import Project:</strong>{' '}
              Click 'Add New' &rarr; Project, select your repository. Framework Preset will auto-detect as 'Vite'.
            </li>
            <li>
              <strong>Build & Output Settings:</strong>
              <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-emerald-300 my-1 space-y-1">
                <p>Build Command: <span className="text-white">npm run build</span></p>
                <p>Output Directory: <span className="text-white">dist</span></p>
                <p>Install Command: <span className="text-white">npm install</span></p>
              </div>
            </li>
            <li>
              <strong>Click Deploy:</strong>{' '}
              Your portal will be live in 60 seconds with a free domain like `bathuary-gp.vercel.app`.
            </li>
          </ol>
        </div>

        {/* vercel.json snippet */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>vercel.json (SPA Routing Configuration)</span>
            <button
              onClick={() => copyToClipboard(vercelJsonCode, 'vercel')}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              {copiedSection === 'vercel' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'vercel' ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
            {vercelJsonCode}
          </pre>
        </div>
      </div>

      {/* Option 2: GitHub Pages */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-slate-800" />
            <h3 className="text-lg font-black text-slate-900">
              Method 2: 100% Free Hosting on GitHub Pages
            </h3>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Free Forever
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            GitHub Pages allows free static hosting directly from your repository forever.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-slate-700">
            <li>
              <strong>Check Vite base path:</strong>{' '}
              If your repository name is `bathuary-gp`, setting `base: './'` in `vite.config.ts` ensures proper asset paths.
            </li>
            <li>
              <strong>Create GitHub Action Workflow:</strong>{' '}
              Add `.github/workflows/deploy.yml` with the following workflow configuration.
            </li>
            <li>
              <strong>Enable GitHub Pages in Settings:</strong>{' '}
              Go to Repo Settings &rarr; Pages &rarr; Source: 'GitHub Actions'.
            </li>
          </ol>
        </div>

        {/* Workflow code snippet */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>.github/workflows/deploy.yml</span>
            <button
              onClick={() => copyToClipboard(ghActionCode, 'gh')}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              {copiedSection === 'gh' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'gh' ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-sky-300 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-56">
            {ghActionCode}
          </pre>
        </div>
      </div>

      {/* Option 3: Docker & Custom Server */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">
              Method 3: Docker Container & Cloud Run
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600">
          For production full-stack deployment with rate-limiting and custom Node server on any VPS, Docker host, or Cloud Run:
        </p>

        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Dockerfile</span>
            <button
              onClick={() => copyToClipboard(dockerfileCode, 'docker')}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              {copiedSection === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'docker' ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
            {dockerfileCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

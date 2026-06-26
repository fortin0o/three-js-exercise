'use client';

import { useState, useRef } from 'react';

export default function DevCompilePage() {
  const [status, setStatus] = useState<'idle' | 'compiling' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const compile = () => {
    setStatus('compiling');
    setProgress(0);

    // Use the mind-ar-ts dist via a sandboxed iframe approach
    // Load the marker and compile it using MindAR's Compiler
    const script = document.createElement('script');
    script.src = '/_next/static/chunks/...';

    // Since we can't easily import the dist as ESM, let's use a dynamic import
    // from the node_modules path via a script tag
    const loader = async () => {
      try {
        // Fetch the marker SVG and convert to Image
        const img = new Image();
        img.onload = async () => {
          // Create canvas from image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);

          // Load MindAR Compiler dynamically via UMD bundle
          const scriptEl = document.createElement('script');
          scriptEl.src = '/mindar/mindar-image.prod.js';
          
          scriptEl.onload = async () => {
            const Compiler = (window as any).MINDAR.IMAGE.Compiler;
            const compiler = new Compiler();

            try {
              const data = await compiler.compileImageTargets(
                [canvas],
                (p: number) => setProgress(Math.round(p))
              );

              const buffer = compiler.exportData();
              const blob = new Blob([buffer], { type: 'application/octet-stream' });
              const url = URL.createObjectURL(blob);
              setDownloadUrl(url);
              setStatus('done');

              // Auto-download
              const a = document.createElement('a');
              a.href = url;
              a.download = 'marker.mind';
              a.click();
            } catch (err) {
              console.error('Compile error:', err);
              setStatus('error');
            }
          };

          scriptEl.onerror = () => {
            setStatus('error');
          };

          document.body.appendChild(scriptEl);
        };

        img.onerror = () => setStatus('error');
        img.src = '/ar/marker.svg';
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    loader();
  };

  return (
    <div className="min-h-dvh bg-[#020408] text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full space-y-6">
        <h1 className="text-2xl font-bold text-cyan-400">Marker Compiler</h1>
        <p className="text-zinc-400 text-sm">
          Compile <code className="text-cyan-300">public/ar/marker.svg</code> to a <code className="text-cyan-300">.mind</code> file for MindAR tracking.
        </p>

        {status === 'idle' && (
          <button
            onClick={compile}
            className="px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Compile Marker
          </button>
        )}

        {status === 'compiling' && (
          <div className="space-y-3">
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-zinc-400">Compiling... {progress}%</p>
          </div>
        )}

        {status === 'done' && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <p className="font-medium">Compilation complete!</p>
            <p className="text-sm mt-1">The file has been downloaded. Place it in <code className="text-emerald-300">public/ar/marker.mind</code></p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
            <p className="font-medium">Compilation failed</p>
            <p className="text-sm mt-1">Check the console for errors. Try using the official MindAR compiler at <a href="https://hiukim.github.io/mind-ar-js-doc/tools/compile" className="underline" target="_blank">hiukim.github.io/mind-ar-js-doc/tools/compile</a></p>
          </div>
        )}

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-400 space-y-2">
          <h2 className="text-white font-medium">What is this?</h2>
          <p>MindAR requires markers to be compiled into a <code>.mind</code> binary format. This page runs the compilation in your browser using TensorFlow.js.</p>
          <ol className="list-decimal list-inside space-y-1 text-zinc-500">
            <li>Click &quot;Compile Marker&quot;</li>
            <li>Wait for compilation (may take 10-30s)</li>
            <li>Save the downloaded <code>marker.mind</code> to <code>public/ar/</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

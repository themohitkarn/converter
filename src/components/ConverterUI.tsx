import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, Download, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tool } from './ToolGrid';
import { converter } from '../engine/ConverterEngine';
import confetti from 'canvas-confetti';

interface ConverterUIProps {
  tool: Tool;
  onClose: () => void;
}

export const ConverterUI: React.FC<ConverterUIProps> = ({ tool, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progressMsg, setProgressMsg] = useState<string>('Initializing...');
  const [resultText, setResultText] = useState<string | null>(null);
  const [results, setResults] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (newFiles: File[]) => {
    if (!tool.batch && newFiles.length > 1) {
      setError('This tool only supports single-file conversion.');
      return;
    }
    setFiles(tool.batch ? [...files, ...newFiles] : [newFiles[0]]);
    setError(null);
  };

  const startConversion = async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setError(null);

    try {
      const formatMap: Record<string, string> = {
        'pdf-to-img': 'jpg',
        'img-to-pdf': 'pdf',
        'docx-to-pdf': 'pdf',
        'ocr': 'txt',
        'pdf-merge': 'pdf',
        'excel-to-csv': 'csv',
        'img-compress': 'webp', // Default to webp for compression
        'qr-generate': 'qr'
      };
      
      const finalFormat = formatMap[tool.id] || 'pdf';

      let resultBlobs: Blob[] = [];

      if (tool.batch && files.length > 1) {
        resultBlobs = await converter.convertBatch(files, finalFormat);
      } else {
        const blob = await converter.convert(
          files[0], 
          finalFormat, 
          (msg) => setProgressMsg(msg),
          (text) => setResultText(text)
        );
        resultBlobs = [blob];
      }

      setResults(resultBlobs);
      setStatus('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f2ff', '#7000ff', '#ff00ea']
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process file. Ensure backend is running.');
      setStatus('error');
    }
  };

  const downloadFile = (blob: Blob, index: number) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = blob.type.split('/')[1] || 'bin';
    const finalExt = ext === 'plain' ? 'txt' : ext;
    a.href = url;
    a.download = `converted-${index + 1}.${finalExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '2.5rem',
          position: 'relative',
          background: 'rgba(10, 10, 10, 0.8)'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="tool-icon" style={{ scale: '0.8', margin: 0 }}>{tool.icon}</div>
          {tool.title}
        </h2>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>{tool.description}</p>

        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--card-border)',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)',
            background: files.length > 0 ? 'rgba(0, 242, 255, 0.03)' : 'transparent',
            borderColor: files.length > 0 ? 'var(--accent-primary)' : 'var(--card-border)'
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            style={{ display: 'none' }} 
            multiple={tool.batch}
            accept={tool.accept}
          />
          <Upload size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} className="neon-text" />
          <p style={{ fontWeight: 500 }}>
            {files.length > 0 ? `${files.length} file(s) selected` : 'Click or drop files here'}
          </p>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>
            Supported: {tool.accept}
          </p>
        </div>

        {error && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255, 0, 0, 0.1)', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          {status === 'idle' || status === 'error' ? (
            <button 
              className="btn-primary" 
              onClick={startConversion} 
              disabled={files.length === 0}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Start Conversion
            </button>
          ) : status === 'processing' ? (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 15, ease: "linear" }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #00f2ff, #7000ff)', boxShadow: '0 0 10px #00f2ff' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                <Loader2 size={18} className="animate-spin" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={progressMsg}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {progressMsg}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00ff88' }}>
                <CheckCircle2 size={24} />
                <span style={{ fontWeight: 600 }}>Conversion Complete!</span>
              </div>
              
              {resultText && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '150px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Extracted Text</p>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: '#ccc', fontFamily: 'inherit' }}>{resultText}</pre>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {results.map((blob, i) => (
                  <button 
                    key={i} 
                    onClick={() => downloadFile(blob, i)} 
                    className="btn-primary"
                    style={{ background: 'rgba(0, 255, 136, 0.1)', border: '1px solid #00ff88', color: '#00ff88' }}
                  >
                    <Download size={18} />
                    Download {tool.id === 'qr-generate' ? 'QR Code' : `Result ${i + 1}`}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => { setFiles([]); setStatus('idle'); setResults([]); setResultText(null); }} 
                style={{ marginTop: '1.5rem', width: '100%', background: 'none', border: '1px solid #333', color: '#888', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer' }}
              >
                Convert More
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

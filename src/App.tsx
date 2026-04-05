import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToolGrid } from './components/ToolGrid';
import type { Tool } from './components/ToolGrid';
import { ConverterUI } from './components/ConverterUI';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container min-h-screen">
      <header style={{ paddingTop: '4rem', paddingBottom: '3rem', textAlign: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', color: 'var(--accent-primary)', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <Sparkles size={16} />
          <span>High-Fidelity Cloud Processing</span>
        </motion.div>
        
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', color: '#00ff88' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
          Cloud Active
        </div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}
        >
          Antigravity <span className="neon-text">Convert</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem' }}
        >
          Secure, fast, and high-fidelity. Cloud-powered precision for every document.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass"
          style={{ 
            maxWidth: '600px', 
            margin: '0 auto', 
            padding: '0.5rem 1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            boxShadow: '0 0 50px rgba(0, 242, 255, 0.1)'
          }}
        >
          <Search size={20} style={{ opacity: 0.5 }} />
          <input 
            type="text" 
            placeholder="Search for a tool (e.g. PDF to Word, OCR, Excel...)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              padding: '1rem 0',
              outline: 'none',
              fontSize: '1rem'
            }}
          />
        </motion.div>
      </header>

      <main style={{ paddingBottom: '6rem' }}>
        <ToolGrid onSelect={(tool) => setActiveTool(tool)} searchQuery={searchQuery} />
      </main>

      <footer style={{ borderTop: '1px solid var(--card-border)', padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>API</a>
        </div>
        <p>© 2026 Antigravity AI. Powered by Advanced Agentic Coding.</p>
      </footer>

      <AnimatePresence>
        {activeTool && (
          <ConverterUI 
            tool={activeTool} 
            onClose={() => setActiveTool(null)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .modal-overlay {
          animation: overlayFade 0.3s ease-out;
        }
        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;

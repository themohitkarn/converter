import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Table, 
  FilePlus, 
  ScanLine, 
  Maximize, 
  Zap,
  QrCode
} from 'lucide-react';
import type { ConversionType } from '../engine/ConverterEngine';

export interface Tool {
  id: ConversionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'document' | 'image' | 'data' | 'utility';
  accept: string;
  batch?: boolean;
}

const tools: Tool[] = [
  {
    id: 'pdf-to-img',
    title: 'PDF to Image',
    description: 'Convert every page of a PDF into high-quality JPEG images.',
    icon: <ImageIcon className="text-cyan-400" />,
    category: 'document',
    accept: '.pdf'
  },
  {
    id: 'img-to-pdf',
    title: 'Images to PDF',
    description: 'Merge multiple images into a single professional PDF document.',
    icon: <FilePlus className="text-purple-400" />,
    category: 'document',
    accept: 'image/*',
    batch: true
  },
  {
    id: 'docx-to-pdf',
    title: 'Word to PDF',
    description: 'Convert Microsoft Word (DOCX) files to PDF while preserving layout.',
    icon: <FileText className="text-blue-400" />,
    category: 'document',
    accept: '.docx'
  },
  {
    id: 'ocr',
    title: 'Image to Text (OCR)',
    description: 'Extract editable text from images using AI-powered recognition.',
    icon: <ScanLine className="text-green-400" />,
    category: 'image',
    accept: 'image/*'
  },
  {
    id: 'pdf-merge',
    title: 'Merge PDFs',
    description: 'Combine two or more PDF files into one seamless document.',
    icon: <Zap className="text-yellow-400" />,
    category: 'document',
    accept: '.pdf',
    batch: true
  },
  {
    id: 'excel-to-csv',
    title: 'Excel to CSV',
    description: 'Quickly convert spreadsheets (XLSX) to clean CSV data.',
    icon: <Table className="text-emerald-400" />,
    category: 'data',
    accept: '.xlsx,.xls'
  },
  {
    id: 'img-compress',
    title: 'Compress Image',
    description: 'Reduce image file size for web use without losing quality.',
    icon: <Maximize className="text-rose-400" />,
    category: 'image',
    accept: 'image/*'
  },
  {
    id: 'qr-generate',
    title: 'QR Generator',
    description: 'Generate high-quality QR codes for URLs, text, or Wi-Fi.',
    icon: <QrCode className="text-indigo-400" />,
    category: 'utility',
    accept: 'text/plain'
  }
];

interface ToolGridProps {
  onSelect: (tool: Tool) => void;
  searchQuery: string;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ onSelect, searchQuery }) => {
  const filteredTools = tools.filter(tool => 
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tool-grid">
      {filteredTools.map((tool, index) => (
        <div 
          key={tool.id} 
          className="glass tool-card animate-fade-in"
          style={{ animationDelay: `${index * 0.05}s` }}
          onClick={() => onSelect(tool)}
        >
          <div className="tool-icon">
            {tool.icon}
          </div>
          <h3 className="tool-title">{tool.title}</h3>
          <p className="tool-description">{tool.description}</p>
          <div style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>
            {tool.batch ? 'Supports Batch' : 'Single File'}
          </div>
        </div>
      ))}
    </div>
  );
};

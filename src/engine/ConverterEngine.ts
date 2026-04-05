// SaaS-Ready Converter Engine
export type ConversionType = 
  | 'pdf-to-img' 
  | 'img-to-pdf' 
  | 'docx-to-pdf' 
  | 'pdf-merge' 
  | 'ocr' 
  | 'excel-to-csv' 
  | 'img-compress'
  | 'qr-generate';

export interface ConversionOptions {
  quality?: number;
  format?: 'png' | 'jpg' | 'webp';
  password?: string;
  watermark?: string;
}

class ConverterEngine {
  private API_BASE = "http://localhost:8000";

  /**
   * Universal SaaS-Ready Conversion
   * This sends any file to the backend, polls for completion, and returns the result.
   */
  async convert(
    file: File, 
    targetFormat: string, 
    onProgress?: (msg: string) => void,
    onResultText?: (text: string) => void
  ): Promise<Blob> {
    // 1. Upload & Create Job
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_format", targetFormat);

    const uploadRes = await fetch(`${this.API_BASE}/upload`, {
      method: "POST",
      body: formData
    });
    
    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.detail || "Upload failed");
    }
    
    const { job_id } = await uploadRes.json();

    // 2. Poll for Completion
    const resultBlob = await this.pollJob(job_id, onProgress, onResultText);
    return resultBlob;
  }

  /**
   * Batch Conversion
   */
  async convertBatch(files: File[], targetFormat: string): Promise<Blob[]> {
    return Promise.all(files.map(file => this.convert(file, targetFormat)));
  }

  /**
   * Internal Polling Mechanism
   */
  private async pollJob(
    jobId: string, 
    onProgress?: (msg: string) => void,
    onResultText?: (text: string) => void
  ): Promise<Blob> {
    let status = "pending";
    const maxRetries = 60; // 90 seconds timeout
    let retries = 0;

    while (retries < maxRetries) {
      const statusRes = await fetch(`${this.API_BASE}/status/${jobId}`);
      if (!statusRes.ok) throw new Error("Status check failed");
      
      const { status: jobStatus, progress, result_text } = await statusRes.json();
      status = jobStatus;

      if (progress && onProgress) onProgress(progress);
      if (result_text && onResultText) onResultText(result_text);

      if (status === "completed") {
        const downloadRes = await fetch(`${this.API_BASE}/download/${jobId}`);
        if (!downloadRes.ok) throw new Error("Download failed");
        return await downloadRes.blob();
      }

      if (status === "failed") {
        throw new Error("Conversion failed on server. Please check the file format.");
      }

      // Exponential-ish backoff or simple delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
    }

    throw new Error("Conversion timed out. The file might be too large.");
  }
}

export const converter = new ConverterEngine();

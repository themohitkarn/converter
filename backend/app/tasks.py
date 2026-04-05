import os
import subprocess
import shutil
from PIL import Image
import pandas as pd
from app.celery_app import celery_app
from app.database import SessionLocal, Job, JobStatus

TEMP_DIR = os.path.join(os.getcwd(), "storage")
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def update_progress(db, job, message):
    job.progress = message
    db.commit()

@celery_app.task(name="app.tasks.process_conversion")
def process_conversion(job_id: str):
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        return f"Job {job_id} not found"
        
    job.status = JobStatus.PROCESSING
    update_progress(db, job, "Analyzing file structure...")
    db.commit()
    
    try:
        input_path = job.input_file
        target_format = job.target_format.lower()
        
        # Prepare output filename
        file_base = str(job_id)[:8]
        # For QR and OCR/TXT, ensure we use standard extensions
        final_ext = 'png' if target_format == 'qr' else ('txt' if target_format in ['ocr', 'txt'] else target_format)
        output_filename = f"out_{file_base}.{final_ext}"
        output_path = os.path.join(TEMP_DIR, output_filename)
        
        # Determine conversion method
        ext = os.path.splitext(input_path)[1].lower()
        
        with open("task_debug.log", "a") as log:
            log.write(f"Job {job_id}: {ext} -> {target_format} (output: {output_filename})\n")

        # 1. Document Conversion (DOCX, XLSX, PPTX -> PDF)
        if ext in ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.rtf', '.odt']:
            update_progress(db, job, "Initializing Document Engine...")
            soffice_path = "soffice" if os.name != 'nt' else r"C:\Program Files\LibreOffice\program\soffice.exe"
            
            update_progress(db, job, "Converting Layout (LibreOffice)...")
            # For documents, LibreOffice converts to the target_format (usually pdf)
            subprocess.run([
                soffice_path, "--headless", "--convert-to", target_format,
                "--outdir", TEMP_DIR, input_path
            ], check=True, capture_output=True)
            
            # LibreOffice output filename is fixed based on input basename
            actual_output = os.path.join(TEMP_DIR, f"{os.path.splitext(os.path.basename(input_path))[0]}.{target_format}")
            if os.path.exists(actual_output):
                if actual_output != output_path:
                    shutil.move(actual_output, output_path)
            else:
                raise Exception("LibreOffice output not found")
        
        # 2. OCR (Image to Text)
        elif target_format in ['ocr', 'txt'] and ext in ['.png', '.jpg', '.jpeg', '.tiff']:
            update_progress(db, job, "Launching Tesseract Engine...")
            import pytesseract
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
            
            update_progress(db, job, "Extracting text from image...")
            # Use RGB to ensure Tesseract compatibility
            with Image.open(input_path) as img:
                text = pytesseract.image_to_string(img.convert('RGB'))
            
            job.result_text = text
            with open(output_path, "w", encoding='utf-8') as f:
                f.write(text or "[No text detected]")
        
        # 3. Image Compression / Formatting
        elif ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp']:
            update_progress(db, job, "Optimizing image canvas...")
            with Image.open(input_path) as img:
                # Ensure we handle transparency if converting to non-alpha formats
                if target_format in ['jpg', 'jpeg'] and img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                quality = 80
                update_progress(db, job, f"Compressing density (Quality: {quality}%)...")
                img.save(output_path, format=target_format.upper() if target_format != 'qr' else 'PNG', quality=quality, optimize=True)
                
        # 4. QR Code Generation
        elif target_format == 'qr':
            update_progress(db, job, "Generating Vector QR...")
            import qrcode
            with open(input_path, 'r') as f:
                data = f.read()
            
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(data)
            qr.make(fit=True)
            
            # Use Neon Cyan Branding
            img = qr.make_image(fill_color="#00f2ff", back_color="black")
            img.save(output_path)
            
        # 5. Data Conversion (CSV <-> JSON)
        elif ext == '.csv' and target_format == 'json':
            update_progress(db, job, "Parsing CSV data...")
            df = pd.read_csv(input_path)
            df.to_json(output_path)
        elif ext == '.json' and target_format == 'csv':
            update_progress(db, job, "Parsing JSON data...")
            df = pd.read_json(input_path)
            df.to_csv(output_path, index=False)
            
        else:
            raise Exception(f"Unsupported conversion: {ext} to {target_format}")
            
        # Finalization
        update_progress(db, job, "Finalizing package...")
        job.status = JobStatus.COMPLETED
        job.output_file = output_path
        db.commit()
        
    except Exception as e:
        print(f"Error processing job {job_id}: {str(e)}")
        job.status = JobStatus.FAILED
        job.progress = f"Error: {str(e)[:50]}"
        db.commit()
    finally:
        db.close()

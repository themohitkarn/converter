from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
import shutil
from app.database import SessionLocal, Job, JobStatus, init_db
from app.celery_app import celery_app

# Configuration
TEMP_DIR = os.path.join(os.getcwd(), "storage")
os.makedirs(TEMP_DIR, exist_ok=True)

# Initialize Database
init_db()

app = FastAPI(title="Antigravity Converter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...), target_format: str = "pdf"):
    job_id = str(uuid.uuid4())
    file_id = str(uuid.uuid4())
    
    # Save original filename extension
    ext = os.path.splitext(file.filename)[1]
    input_filename = f"{file_id}{ext}"
    input_path = os.path.join(TEMP_DIR, input_filename)
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db = SessionLocal()
    try:
        new_job = Job(id=job_id, input_file=input_path, target_format=target_format)
        db.add(new_job)
        db.commit()
    finally:
        db.close()
    
    # Trigger Task
    if os.getenv("REDIS_URL"):
        celery_app.send_task("app.tasks.process_conversion", args=[job_id])
    else:
        # Fallback to local background tasks
        from app.tasks import process_conversion
        background_tasks.add_task(process_conversion, job_id)
    
    return {"job_id": job_id, "status": JobStatus.PENDING}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_id).first()
    db.close()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "job_id": job.id, 
        "status": job.status, 
        "progress": job.progress,
        "result_text": job.result_text,
        "output_file": os.path.basename(job.output_file) if job.output_file else None
    }

@app.get("/download/{job_id}")
async def download_file(job_id: str):
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_id).first()
    db.close()
    
    if not job or job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="File not ready or job failed")
    
    if not os.path.exists(job.output_file):
        raise HTTPException(status_code=404, detail="File gone from storage")
        
    return FileResponse(job.output_file, filename=os.path.basename(job.output_file))

@app.get("/health")
def health():
    return {"status": "healthy"}

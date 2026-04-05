import sys
import os

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.tasks import process_conversion
from app.database import SessionLocal, Job, JobStatus
import uuid

def debug_ocr():
    print("--- Debugging OCR ---")
    db = SessionLocal()
    job_id = str(uuid.uuid4())
    
    # Needs a real image to test properly, but let's see if imports work
    test_img = os.path.join(os.getcwd(), "test_ocr.png")
    if not os.path.exists(test_img):
        print(f"FAILED: {test_img} not found. Run the PIL creation script first.")
        return

    job = Job(id=job_id, input_file=test_img, target_format="ocr")
    db.add(job)
    db.commit()
    db.close()
    
    try:
        process_conversion(job_id)
        print("Success or caught internal error.")
    except Exception as e:
        print(f"CRASHED: {str(e)}")
        import traceback
        traceback.print_exc()

def debug_qr():
    print("\n--- Debugging QR ---")
    db = SessionLocal()
    job_id = str(uuid.uuid4())
    
    test_txt = os.path.join(os.getcwd(), "test_qr.txt")
    if not os.path.exists(test_txt):
        with open(test_txt, "w") as f: f.write("test")

    job = Job(id=job_id, input_file=test_txt, target_format="qr")
    db.add(job)
    db.commit()
    db.close()
    
    try:
        process_conversion(job_id)
        print("Success or caught internal error.")
    except Exception as e:
        print(f"CRASHED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_ocr()
    debug_qr()

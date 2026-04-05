import os
import subprocess
from PIL import Image
from docx2pdf import convert as docx2pdf_convert
import pandas as pd

def convert_image(input_path, output_path, target_format):
    with Image.open(input_path) as img:
        img.save(output_path, format=target_format.upper())

def convert_document(input_path, output_path):
    # docx2pdf (for Windows) or libreoffice-headless (for Linux/Docker)
    if os.name == 'nt':
        docx2pdf_convert(input_path, output_path)
    else:
        # LibreOffice headless in Docker
        subprocess.run([
            "soffice", "--headless", "--convert-to", "pdf", 
            "--outdir", os.path.dirname(output_path), input_path
        ], check=True)

def convert_data(input_path, output_path, input_format, target_format):
    if input_format == 'csv' and target_format == 'json':
        df = pd.read_csv(input_path)
        df.to_json(output_path)
    elif input_format == 'json' and target_format == 'csv':
        df = pd.read_json(input_path)
        df.to_csv(output_path, index=False)

def convert_media(input_path, output_path):
    # Use FFmpeg wrapper
    subprocess.run(["ffmpeg", "-i", input_path, output_path], check=True)

import os
import shutil
from fastapi import UploadFile

class StorageService:
    def __init__(self):
        # Base uploads directory: backend/uploads
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.base_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "uploads"))

    def save_upload(self, file: UploadFile, doc_id: str) -> str:
        """
        Saves an uploaded file to backend/uploads/{doc_id}/{filename}.
        Creates the directory if it does not exist.
        Returns the absolute file path.
        """
        doc_dir = os.path.join(self.base_dir, doc_id)
        os.makedirs(doc_dir, exist_ok=True)
        
        file_path = os.path.join(doc_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

    def delete_upload(self, doc_id: str) -> bool:
        """
        Deletes the backend/uploads/{doc_id}/ directory and its contents.
        Returns True on success.
        """
        doc_dir = os.path.join(self.base_dir, doc_id)
        if os.path.exists(doc_dir):
            shutil.rmtree(doc_dir)
        return True

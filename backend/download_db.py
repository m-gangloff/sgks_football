import os
import io
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2 import service_account

load_dotenv()

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def download_db_from_gdrive(file_id, dest_path, creds_path):
    creds = service_account.Credentials.from_service_account_file(
        creds_path, scopes=['https://www.googleapis.com/auth/drive']
    )
    service = build('drive', 'v3', credentials=creds)
    request = service.files().get_media(fileId=file_id)
    fh = io.FileIO(dest_path, 'wb')
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        status, done = downloader.next_chunk()
        if status:
            print(f"Download {int(status.progress() * 100)}%.")
    print(f"Downloaded {dest_path} from Google Drive.")

if __name__ == "__main__":
    FILE_ID = os.environ.get("GDRIVE_DB_FILE_ID")
    CREDS_PATH = os.environ.get(
        "GDRIVE_SERVICE_ACCOUNT_JSON",
        os.path.join(SCRIPT_DIR, "gdrive_service_account.json")
    )
    DEST_PATH = os.environ.get(
        "GDRIVE_DB_DEST_PATH",
        os.path.join(SCRIPT_DIR, "football.db")
    )

    if not FILE_ID or not os.path.exists(CREDS_PATH):
        print("Missing FILE_ID or Service Account JSON.")
        exit(1)

    download_db_from_gdrive(FILE_ID, DEST_PATH, CREDS_PATH) 
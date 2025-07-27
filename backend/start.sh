#!/bin/bash
python download_db.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 10000
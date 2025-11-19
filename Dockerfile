# 1. Start from a lightweight, official Python image
FROM python:3.11-slim

# 2. Set the working directory inside the container
# All subsequent commands will run from here
WORKDIR /app

# 3. Copy dependencies first (for better caching)
COPY requirements.txt .

# 4. Install Python dependencies
# --no-cache-dir keeps the image smaller
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy your source code into the container
# We copy the 'app' folder to /app/app
COPY app /app/app
# We also copy scripts in case we need to run ingestion inside the container
COPY scripts /app/scripts
# --- NEW: Copy Database Migration files ---
COPY alembic /app/alembic
COPY alembic.ini /app/alembic.ini

# 6. Define the command to start the server
# --host 0.0.0.0 is CRITICAL for Docker. It makes the server accessible outside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
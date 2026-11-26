import os
import zipfile

ZIP_NAME = "EduSphere_LMS_Complete_Project.zip"

EXCLUDE_DIRS = {
    "node_modules",
    ".next",
    "__pycache__",
    ".pytest_cache",
    ".git",
    ".venv",
    "venv",
    "dist",
    ".system_generated",
    ".gemini",
    ".claude",
    ".cursor"
}

EXCLUDE_FILES = {
    ZIP_NAME,
    ".env",
    ".env.local",
    ".env.production",
    "npm-debug.log",
}

print(f"Creating submission archive: {ZIP_NAME}...")

with zipfile.ZipFile(ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk("."):
        # Prune excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".next")]
        
        for file in files:
            if file in EXCLUDE_FILES or file.endswith(".pyc") or file.endswith(".log"):
                continue
            
            file_path = os.path.join(root, file)
            # Relative arcname
            arcname = os.path.relpath(file_path, ".")
            zf.write(file_path, arcname)

size_mb = os.path.getsize(ZIP_NAME) / (1024 * 1024)
print(f"✅ Created {ZIP_NAME} ({size_mb:.2f} MB)")

# Verification: test extraction of file list
with zipfile.ZipFile(ZIP_NAME, "r") as zf:
    test_res = zf.testzip()
    namelist = zf.namelist()
    if test_res is None:
        print(f"✅ ZIP Archive Verified Successfully! Contains {len(namelist)} files without corruption.")
    else:
        print(f"❌ Corrupt file in zip: {test_res}")
        sys.exit(1)

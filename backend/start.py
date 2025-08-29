import uvicorn
import os
from main import app

if __name__ == "__main__":
    # Get port from environment variable (Render will provide this)
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Allow external connections
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    ) 
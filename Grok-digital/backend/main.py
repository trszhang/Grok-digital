from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from orchestrator import Orchestrator
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    orchestrator = Orchestrator(websocket)
    
    try:
        while True:
            # Receive either text or binary
            message = await websocket.receive()
            
            if "text" in message:
                await orchestrator.handle_message(message["text"], is_binary=False)
            elif "bytes" in message:
                await orchestrator.handle_message(message["bytes"], is_binary=True)
                
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
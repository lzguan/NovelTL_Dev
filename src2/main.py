from fastapi import FastAPI
from .auth.router import router as auth_router
from .novels.router import router as novel_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(novel_router)

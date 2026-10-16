from fastapi import APIRouter
from backend.app.services.ai_service import ai_service
from backend.app.models.schemas import ChatRequest

router = APIRouter(prefix="/api/ai", tags=["Artificial Intelligence"])

@router.get("/insights")
def get_quick_insights():
    return ai_service.generate_quick_insights()

@router.get("/summary")
def get_executive_summary():
    return ai_service.generate_executive_summary()

@router.post("/chat")
def answer_business_question(req: ChatRequest):
    return ai_service.answer_query(req.query)

from fastapi import APIRouter, Query, Response
from backend.app.services.experiment_service import experiment_service

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])

@router.get("/summary")
def get_experiment_summary(target: str = Query("Profit", description="Target variable")):
    return experiment_service.get_experiment_summary(target_variable=target)

@router.get("/export-markdown")
def export_experiment_markdown(target: str = Query("Profit", description="Target variable")):
    md_content = experiment_service.export_experiment_markdown(target_variable=target)
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="Research_Experiment_Results_{target}.md"'}
    )


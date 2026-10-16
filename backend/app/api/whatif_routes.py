from fastapi import APIRouter
from backend.app.services.whatif_service import whatif_service
from backend.app.models.schemas import WhatIfRequest

router = APIRouter(prefix="/api/whatif", tags=["What-If Analysis"])

@router.post("/simulate")
def simulate_scenario(req: WhatIfRequest):
    return whatif_service.simulate_scenario(
        target_variable=req.target_variable,
        base_features=req.base_features,
        scenario_changes=req.scenario_changes
    )

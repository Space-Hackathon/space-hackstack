from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.extensions import predict as run_prediction, model_info

router = APIRouter(prefix="/ml", tags=["ml"])


@router.get("/model")
def get_model_info() -> dict[str, Any]:
    return model_info()


@router.post("/predict")
def predict(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        return run_prediction(payload)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

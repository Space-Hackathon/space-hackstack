from app.extensions import load_pipeline
from app.core.config import get_settings

def test_capabilities(client):
    body = client.get("/api/capabilities").json()
    assert body["contract_version"] == "1"
    assert body["max_upload_bytes"] == get_settings().max_upload_mb * 1024 * 1024
    assert {"csv", "tle"} <= {p["name"] for p in body["processors"]}

def test_configured_processor_end_to_end(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "processor_modules", ["app.plugins.ndjson"])
    from app.extensions import load_extensions
    load_extensions()
    result = client.post("/api/files", files={"file": ("records.jsonl", b'{"value":1}\n{"value":2}\n', "application/x-ndjson")})
    assert result.status_code == 201
    assert result.json()["processor"] == "ndjson"
    assert result.json()["result"]["record_count"] == 2
    assert any(p["name"] == "ndjson" for p in client.get("/api/processors").json())
    bad = client.post("/api/files", files={"file": ("bad.jsonl", b'{bad}\n', "application/x-ndjson")})
    assert bad.json()["status"] == "failed"

def test_configured_pipeline_through_api(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "ml_pipeline_module", "app.plugins.rms")
    assert client.get("/api/ml/model").json()["model"] == "example-rms"
    response = client.post("/api/ml/predict", json={"features": [3, 3]})
    assert response.json() == {"prediction": 3.0, "model": "example-rms"}
    assert client.post("/api/ml/predict", json={"features": [True]}).status_code == 422

def test_invalid_plugin_fails_early():
    import pytest
    with pytest.raises(TypeError):
        load_pipeline("app.plugins.ndjson")

def test_pagination_validation(client):
    assert client.get("/api/files?offset=-1").status_code == 422
    assert client.get("/api/files?limit=0").status_code == 422

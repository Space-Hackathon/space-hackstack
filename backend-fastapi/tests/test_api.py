import io

import pytest
from PIL import Image


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_processors(client):
    names = {p["name"] for p in client.get("/api/processors").json()}
    assert {"csv", "txt", "json", "image", "tle"} <= names


def test_upload_tle_is_parsed(client, samples):
    with (samples / "iss.tle").open("rb") as f:
        r = client.post("/api/files", files={"file": ("iss.tle", f, "text/plain")})
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "processed"
    assert body["processor"] == "tle"
    sat = body["result"]["satellites"][0]
    assert sat["norad_id"] == 25544
    assert sat["inclination_deg"] == pytest.approx(51.6416)
    assert 90 < sat["period_min"] < 93
    assert 300 < sat["perigee_km"] < 400


def test_upload_csv_stats(client, samples):
    with (samples / "ground_passes.csv").open("rb") as f:
        r = client.post("/api/files", files={"file": ("ground_passes.csv", f, "text/csv")})
    result = r.json()["result"]
    assert result["row_count"] == 5
    assert "satellite" not in result["numeric_stats"]
    assert result["numeric_stats"]["elevation_deg"]["max"] == pytest.approx(54.3)


def test_upload_image(client):
    buf = io.BytesIO()
    Image.new("RGB", (4, 3), (10, 20, 30)).save(buf, format="PNG")
    r = client.post("/api/files", files={"file": ("tile.png", buf.getvalue(), "image/png")})
    result = r.json()["result"]
    assert (result["width"], result["height"]) == (4, 3)
    assert result["band_stats"]["G"]["mean"] == 20


def test_invalid_json_is_marked_failed(client):
    r = client.post("/api/files", files={"file": ("bad.json", b"{not json", "application/json")})
    assert r.status_code == 201
    assert r.json()["status"] == "failed"
    assert "Invalid JSON" in r.json()["error"]


def test_file_lifecycle(client):
    r = client.post("/api/files?process=false", files={"file": ("../../evil.txt", b"a b c\nd", "text/plain")})
    file_id = r.json()["id"]
    assert r.json()["filename"] == "evil.txt"
    assert r.json()["status"] == "uploaded"

    assert any(f["id"] == file_id for f in client.get("/api/files").json())

    r = client.post(f"/api/files/{file_id}/process")
    assert r.json()["result"]["word_count"] == 4

    assert client.get(f"/api/files/{file_id}/download").content == b"a b c\nd"

    assert client.delete(f"/api/files/{file_id}").status_code == 204
    assert client.get(f"/api/files/{file_id}").status_code == 404


def test_unknown_processor(client):
    r = client.post("/api/files?processor=nope", files={"file": ("x.txt", b"x", "text/plain")})
    assert r.status_code == 400


def test_ml_predict(client):
    assert client.get("/api/ml/model").json()["model"] == "dummy-mean"
    r = client.post("/api/ml/predict", json={"features": [1, 2, 3]})
    assert r.json()["prediction"] == 2
    assert client.post("/api/ml/predict", json={"features": "x"}).status_code == 422

from fastapi.testclient import TestClient

from demo_app import app

client = TestClient(app)


def test_index():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"msg": "Hello, world!"}

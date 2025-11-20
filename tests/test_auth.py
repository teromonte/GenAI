from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.db.models import User
from app.core.security import get_password_hash

def test_signup_success(client: TestClient):
    response = client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_signup_duplicate_email(client: TestClient, db_session: Session):
    # Create a user first
    user = User(email="existing@example.com", hashed_password=get_password_hash("password"))
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/auth/signup",
        json={"email": "existing@example.com", "password": "newpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_success(client: TestClient, db_session: Session):
    # Create a user
    password = "securepassword"
    hashed = get_password_hash(password)
    user = User(email="login@example.com", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/auth/token",
        data={"username": "login@example.com", "password": password}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client: TestClient):
    response = client.post(
        "/api/auth/token",
        data={"username": "wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401

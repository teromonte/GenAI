import requests

API_URL = "http://localhost:8000/api/auth/signup"

def create_user():
    user_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    try:
        response = requests.post(API_URL, json=user_data)
        if response.status_code == 200:
            print("User created successfully!")
            print(response.json())
        elif response.status_code == 400 and "Email already registered" in response.text:
            print("User already exists.")
        else:
            print(f"Failed to create user: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error connecting to API: {e}")

if __name__ == "__main__":
    create_user()

"""Browser checks with a simulated API. Does not contact Supabase or send email."""
import base64
import functools
import hashlib
import http.server
import json
from datetime import datetime, timezone
from pathlib import Path
import threading
import time
from uuid import uuid4
from urllib.parse import parse_qs, urlsplit


root = Path(__file__).resolve().parents[1]
server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0),
    functools.partial(http.server.SimpleHTTPRequestHandler, directory=root / "dist"),
)
origin = f"http://127.0.0.1:{server.server_port}"
def start():
    threading.Thread(target=server.serve_forever, daemon=True).start()
timestamp = "2026-11-21T13:00:00.000Z"
user = {"id": "11111111-1111-4111-8111-111111111111", "email": "qa@example.invalid"}
projects = []
history = []
profiles = []
requests = []
challenges = {}
reviews = {}
review_requests = []
fail_reviews = False
refresh_allowed = True
refresh_count = 0


def jwt_part(payload):
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")


def simulated_api(route):
    global refresh_count
    request = route.request
    path = urlsplit(request.url).path
    method = request.method
    requests.append((method, path))
    data = request.post_data_json if request.post_data else {}
    if path == "/config.json":
        response = {"url": origin, "key": "sb_publishable_test_fixture", "inspectionSync": True}
    elif path == "/auth/v1/token":
        grant = parse_qs(urlsplit(request.url).query)["grant_type"][0]
        if grant == "pkce":
            action = {"signup-code": "signup", "recovery-code": "recover"}[data["auth_code"]]
            verifier = data["code_verifier"].encode()
            challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier).digest()).decode().rstrip("=")
            assert challenge == challenges[action]
        elif grant == "refresh_token":
            refresh_count += 1
            if not refresh_allowed:
                return route.fulfill(status=400,json={"error_code":"refresh_token_not_found","message":"Refresh token not found"})
        else:
            assert grant == "password" and data["email"] == user["email"]
            if data["password"] != "test-password-123":
                return route.fulfill(status=400, json={"code": "invalid_credentials", "message": "Invalid login credentials"})
        exp = int(time.time()) + 3600
        token = f"{jwt_part({'alg':'HS256'})}.{jwt_part({'sub':user['id'], 'exp':exp})}.fixture"
        response = {"access_token": token, "refresh_token": "fixture", "token_type": "bearer",
                    "expires_in": 3600, "expires_at": exp, "user": user}
    elif path == "/auth/v1/logout":
        return route.fulfill(status=204, body="")
    elif path in ("/auth/v1/signup", "/auth/v1/recover"):
        action = path.rsplit("/", 1)[1]
        destination = parse_qs(urlsplit(request.url).query)["redirect_to"][0]
        assert destination == origin + ("/" if action == "signup" else "/?recuperar=1")
        assert data["code_challenge_method"] == "s256"
        assert len(data["code_challenge"]) == 43
        challenges[action] = data["code_challenge"]
        response = user if action == "signup" else {}
    elif path == "/auth/v1/user":
        if method == "PUT":
            assert data["password"] == "test-new-password-456"
        response = user
    elif path == "/rest/v1/inspection_reviews":
        review_requests.append(method)
        if fail_reviews:
            return route.fulfill(status=503, json={})
        code = parse_qs(urlsplit(request.url).query)["case_code"][0][3:]
        row = reviews.get(code)
        if method == "GET":
            response = [row] if row else []
        elif method == "PATCH" and (not row or "revision=eq."+row["revision"] not in request.url):
            response = []
        elif method == "POST" and row:
            return route.fulfill(status=409,json={})
        else:
            reviews[code] = {**(row or {}), **data, "owner_id": user["id"],"revision":str(uuid4()),
                             "created_at":timestamp,"updated_at":timestamp}
            response = [reviews[code]]
    elif path == "/rest/v1/projects":
        params = parse_qs(urlsplit(request.url).query)
        now = datetime.now(timezone.utc).isoformat()
        owned = [p for p in projects if p["owner_id"] == user["id"]]
        if method == "POST":
            assert set(data) == {"title", "description"}
            response = {**data, "id":str(uuid4()),"owner_id":user["id"],"created_at":now,"updated_at":now}
            projects.append(response)
        elif method in ("PATCH","DELETE"):
            assert params["owner_id"] == ["eq."+user["id"]]
            row = next((p for p in owned if "eq."+p["id"] == params["id"][0] and "eq."+p["updated_at"] == params["updated_at"][0]),None)
            if not row:
                return route.fulfill(status=406,json={"code":"PGRST116"})
            response = row
            if method == "PATCH":
                row.update(data,updated_at=now)
            else:
                projects.remove(row)
                history[:] = [v for v in history if v["project_id"] != row["id"]]
        else:
            response = sorted(owned,key=lambda p:p["updated_at"],reverse=True)
        if method in ("POST","PATCH"):
            history.insert(0,{**data,"project_id":response["id"],"recorded_at":now,"id":str(uuid4())})
    elif path == "/rest/v1/profiles":
        if method in ("POST", "PATCH"):
            profiles[:] = [data]
            response = data
        else:
            response = profiles
    elif path == "/rest/v1/project_versions":
        project_id = parse_qs(urlsplit(request.url).query)["project_id"][0][3:]
        response = [v for v in history if v["project_id"] == project_id and any(p["id"] == project_id and p["owner_id"] == user["id"] for p in projects)]
    else:
        raise AssertionError((method, path))
    route.fulfill(status=200, json=response)



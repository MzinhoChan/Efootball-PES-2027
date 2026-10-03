import json
import os
import sqlite3
from datetime import datetime, timezone

from flask import Flask, render_template, jsonify, request, session

app = Flask(__name__, template_folder='.', static_folder='.')
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-change-this-secret')

try:
    from config import GOOGLE_CLIENT_ID as CONFIG_GOOGLE_CLIENT_ID
except ImportError:
    CONFIG_GOOGLE_CLIENT_ID = ''

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', CONFIG_GOOGLE_CLIENT_ID).strip()
DB_PATH = os.environ.get('PES_DB_PATH', os.path.join(os.path.dirname(__file__), 'pes2027.db'))

try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False


def db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA foreign_keys=ON')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            google_sub TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            name TEXT,
            picture TEXT,
            app_data TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    return conn


def get_user_data(google_sub):
    conn = db()
    row = conn.execute('SELECT app_data FROM users WHERE google_sub = ?', (google_sub,)).fetchone()
    conn.close()
    if not row:
        return {}
    try:
        return json.loads(row['app_data'])
    except Exception:
        return {}


def save_user_data(google_sub, app_data):
    payload = json.dumps(app_data, ensure_ascii=False)
    now = datetime.now(timezone.utc).isoformat()
    conn = db()
    conn.execute('UPDATE users SET app_data = ?, updated_at = ? WHERE google_sub = ?', (payload, now, google_sub))
    conn.commit()
    conn.close()


@app.route('/')
def index():
    return render_template('index.html', google_client_id=GOOGLE_CLIENT_ID)


@app.post('/api/google-login')
def google_login():
    if not GOOGLE_CLIENT_ID:
        return jsonify({'ok': False, 'error': 'GOOGLE_CLIENT_ID não configurado no servidor.'}), 503

    if not GOOGLE_AUTH_AVAILABLE:
        return jsonify({'ok': False, 'error': 'Dependência google-auth não instalada. Execute: pip install -r requirements.txt'}), 503

    data = request.get_json(silent=True) or {}
    credential = data.get('credential', '')
    if not credential:
        return jsonify({'ok': False, 'error': 'Credencial do Google não recebida.'}), 400

    try:
        info = id_token.verify_oauth2_token(credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        google_sub = info.get('sub')
        email = (info.get('email') or '').strip().lower()
        if not google_sub or not email:
            return jsonify({'ok': False, 'error': 'O Google não retornou uma identidade válida.'}), 401

        name = info.get('name') or email.split('@')[0]
        picture = info.get('picture') or ''
        conn = db()
        conn.execute('''
            INSERT INTO users (google_sub, email, name, picture, app_data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(google_sub) DO UPDATE SET
                email=excluded.email, name=excluded.name, picture=excluded.picture
        ''', (google_sub, email, name, picture, '{}', datetime.now(timezone.utc).isoformat()))
        conn.commit()
        conn.close()

        session.clear()
        session['google_sub'] = google_sub
        session['email'] = email
        session['name'] = name
        session.permanent = True

        return jsonify({
            'ok': True,
            'user': {
                'id': google_sub,
                'email': email,
                'name': name,
                'picture': picture,
                'email_verified': bool(info.get('email_verified', False))
            },
            'appData': get_user_data(google_sub)
        })
    except Exception as exc:
        print(f'Google Login Error: {exc}')
        return jsonify({'ok': False, 'error': 'Não foi possível validar a conta Google.'}), 401


@app.get('/api/sync')
def sync_load():
    google_sub = session.get('google_sub')
    if not google_sub:
        return jsonify({'ok': False, 'error': 'Sessão Google não encontrada.'}), 401
    return jsonify({'ok': True, 'appData': get_user_data(google_sub)})


@app.put('/api/sync')
def sync_save():
    google_sub = session.get('google_sub')
    if not google_sub:
        return jsonify({'ok': False, 'error': 'Sessão Google não encontrada.'}), 401

    data = request.get_json(silent=True) or {}
    app_data = data.get('appData')
    if not isinstance(app_data, dict):
        return jsonify({'ok': False, 'error': 'Dados da carreira inválidos.'}), 400

    save_user_data(google_sub, app_data)
    return jsonify({'ok': True, 'savedAt': datetime.now(timezone.utc).isoformat()})


@app.post('/api/logout')
def api_logout():
    session.clear()
    return jsonify({'ok': True})


if __name__ == '__main__':
    # host 0.0.0.0 permite abrir pelo celular na mesma rede quando o PC estiver executando o servidor.
    app.run(host='0.0.0.0', debug=True, port=5000)

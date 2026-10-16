# database.py
# eFootball PES 2027 — Banco de dados + autenticação
# 3

import sqlite3
import hashlib
import secrets
import json
from datetime import datetime
from pathlib import Path

DATABASE = Path(__file__).parent / "database.db"


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS careers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mode TEXT NOT NULL,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
                ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()


def hash_password(password):
    salt = secrets.token_hex(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        120000
    ).hex()

    return f"{salt}${password_hash}"


def verify_password(password, stored_password):
    try:
        salt, password_hash = stored_password.split("$", 1)

        new_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            120000
        ).hex()

        return secrets.compare_digest(new_hash, password_hash)

    except Exception:
        return False


def create_user(username, email, password):
    username = username.strip()
    email = email.strip().lower()

    if not username or not email or not password:
        return False, "Preencha todos os campos."

    if len(password) < 6:
        return False, "A senha precisa ter pelo menos 6 caracteres."

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (username, email)
        )

        if cursor.fetchone():
            return False, "Usuário ou e-mail já cadastrado."

        cursor.execute("""
            INSERT INTO users (
                username,
                email,
                password_hash,
                created_at
            )
            VALUES (?, ?, ?, ?)
        """, (
            username,
            email,
            hash_password(password),
            datetime.now().isoformat()
        ))

        conn.commit()

        return True, "Conta criada com sucesso."

    except sqlite3.IntegrityError:
        return False, "Usuário ou e-mail já cadastrado."

    finally:
        conn.close()


def login_user(email, password):
    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT *
            FROM users
            WHERE email = ?
        """, (email.strip().lower(),))

        user = cursor.fetchone()

        if not user:
            return None

        if not verify_password(password, user["password_hash"]):
            return None

        return dict(user)

    finally:
        conn.close()


def save_career(user_id, mode, career_id, career_name, career_data):
    conn = get_connection()

    try:
        now = datetime.now().isoformat()

        data = json.dumps(
            career_data,
            ensure_ascii=False
        )

        cursor = conn.cursor()

        cursor.execute("""
            SELECT id
            FROM careers
            WHERE user_id = ?
            AND mode = ?
            AND name = ?
        """, (
            user_id,
            mode,
            career_name
        ))

        existing = cursor.fetchone()

        if existing:

            cursor.execute("""
                UPDATE careers
                SET data = ?,
                    updated_at = ?
                WHERE id = ?
            """, (
                data,
                now,
                existing["id"]
            ))

        else:

            cursor.execute("""
                INSERT INTO careers (
                    user_id,
                    mode,
                    name,
                    data,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                mode,
                career_name,
                data,
                now,
                now
            ))

        conn.commit()

    finally:
        conn.close()


def load_careers(user_id, mode):
    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT *
            FROM careers
            WHERE user_id = ?
            AND mode = ?
            ORDER BY updated_at DESC
        """, (
            user_id,
            mode
        ))

        rows = cursor.fetchall()

        result = {}

        for row in rows:
            try:
                data = json.loads(row["data"])
            except Exception:
                data = {}

            result[str(row["id"])] = {
                "id": row["id"],
                "name": row["name"],
                "data": data,
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            }

        return result

    finally:
        conn.close()


def delete_career(user_id, career_id):
    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM careers
            WHERE id = ?
            AND user_id = ?
        """, (
            career_id,
            user_id
        ))

        conn.commit()

        return cursor.rowcount > 0

    finally:
        conn.close()


init_database()
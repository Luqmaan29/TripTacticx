from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    trips = db.relationship('Trip', backref='user', lazy=True)

class Trip(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=True) # Making nullable for now to fit existing flow if needed
    end_date = db.Column(db.Date, nullable=True)
    days = db.Column(db.Integer, nullable=False)
    group_size = db.Column(db.Integer, nullable=False)
    budget = db.Column(db.Float, nullable=False)
    trip_type = db.Column(db.String(50), nullable=True)
    whatsapp_number = db.Column(db.String(20), nullable=True)
    details_json = db.Column(db.Text, nullable=True) # storing the full agent output
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

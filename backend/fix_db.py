from app import app, db, User
from werkzeug.security import generate_password_hash

def fix_db():
    with app.app_context():
        print("🔧 Checking Database...")
        db.create_all()
        
        email = 'triptacticx@gmail.com'
        password = 'admin123'
        
        # Check if admin exists
        admin = User.query.filter_by(email=email).first()
        
        if not admin:
            print(f"⚠️ Admin not found. Creating default admin: {email}")
            new_admin = User(
                email=email,
                name="TripTacticx Admin",
                password_hash=generate_password_hash(password),
                is_admin=True
            )
            db.session.add(new_admin)
            db.session.commit()
            print("✅ Admin created successfully!")
        else:
            print("✅ Admin already exists.")

if __name__ == "__main__":
    fix_db()

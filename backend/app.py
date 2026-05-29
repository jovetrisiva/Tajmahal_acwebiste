import pymysql
pymysql.install_as_MySQLdb()
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()


app = Flask(__name__)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    return response

    
database_url = os.getenv("DATABASE_URL").strip()
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

with app.app_context():
    try:
        db.create_all()
        print("Tables created successfully!")
    except Exception as e:
        print("Error creating tables:", e)

class Booking(db.Model):
    __tablename__ = "booking"
    id       = db.Column(db.Integer, primary_key=True)
    name     = db.Column(db.String(100), nullable=False)
    phone    = db.Column(db.String(20), nullable=False)
    email    = db.Column(db.String(120))
    service  = db.Column(db.String(50), nullable=False)
    acBrand  = db.Column(db.String(50))
    date     = db.Column(db.Date, nullable=False)
    message  = db.Column(db.Text)
    status   = db.Column(db.String(20), default='pending')

    def to_dict(self):
        return {
            "id":      self.id,
            "name":    self.name,
            "phone":   self.phone,
            "email":   self.email,
            "service": self.service,
            "acBrand": self.acBrand,
            "date":    self.date.strftime("%Y-%m-%d") if self.date else "",
            "message": self.message,
            "status":  self.status
        }

@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/api/bookings', methods=['GET', 'POST', 'OPTIONS'])
def bookings():
    if request.method == 'GET':
        try:
            all_bookings = Booking.query.order_by(Booking.id.desc()).all()
            return jsonify([b.to_dict() for b in all_bookings])
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if request.method == 'POST':
        try:
            data = request.get_json()
            print("DATA RECEIVED:", data)

            if data is None:
                return jsonify({"error": "Invalid JSON"}), 400
            if not data.get('name') or not data.get('phone'):
                return jsonify({"error": "Name and Phone required"}), 400

            date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()

            booking = Booking(
                name=data['name'],
                phone=data['phone'],
                email=data.get('email', ''),
                service=data.get('service', ''),
                acBrand=data.get('acBrand', ''),
                date=date_obj,
                message=data.get('message', '')
            )
            db.session.add(booking)
            db.session.commit()
            print("SAVED!")
            return jsonify({"success": True, "message": "Booking received!"}), 201

        except Exception as e:
            print("ERROR:", e)
            return jsonify({"error": str(e)}), 500

@app.route('/api/bookings/<int:id>', methods=['PATCH', 'DELETE', 'OPTIONS'])
def booking_detail(id):
    if request.method == 'PATCH':
        try:
            data = request.get_json()
            booking = Booking.query.get(id)
            if not booking:
                return jsonify({"error": "Not found"}), 404
            if 'status' in data:
                booking.status = data['status']
            db.session.commit()
            return jsonify({"success": True, "booking": booking.to_dict()}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if request.method == 'DELETE':
        try:
            booking = Booking.query.get(id)
            if not booking:
                return jsonify({"error": "Not found"}), 404
            db.session.delete(booking)
            db.session.commit()
            return jsonify({"success": True}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
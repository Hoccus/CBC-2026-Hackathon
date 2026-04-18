import sqlite3
from datetime import date
from typing import Dict, Optional
import json

class MacroDatabase:
    def __init__(self, db_path: str = "macro_tracker.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize the database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create daily_tracking table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_tracking (
                date TEXT PRIMARY KEY,
                consumed_calories REAL DEFAULT 0,
                consumed_protein REAL DEFAULT 0,
                consumed_carbs REAL DEFAULT 0,
                consumed_fat REAL DEFAULT 0,
                target_calories REAL,
                target_protein REAL,
                target_carbs REAL,
                target_fat REAL
            )
        """)
        
        # Create food_logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS food_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                meal_name TEXT,
                calories REAL,
                protein_g REAL,
                carbs_g REAL,
                fat_g REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def set_daily_targets(self, targets: Dict[str, float], tracking_date: str = None):
        """Set or update daily macro targets"""
        if tracking_date is None:
            tracking_date = str(date.today())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO daily_tracking (date, target_calories, target_protein, target_carbs, target_fat)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                target_calories = excluded.target_calories,
                target_protein = excluded.target_protein,
                target_carbs = excluded.target_carbs,
                target_fat = excluded.target_fat
        """, (tracking_date, targets['calories'], targets['protein_g'], 
              targets['carbs_g'], targets['fat_g']))
        
        conn.commit()
        conn.close()
    
    def log_food(self, food_data: Dict[str, float], tracking_date: str = None):
        """Log consumed food and update daily totals"""
        if tracking_date is None:
            tracking_date = str(date.today())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Insert food log
        cursor.execute("""
            INSERT INTO food_logs (date, meal_name, calories, protein_g, carbs_g, fat_g)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (tracking_date, food_data.get('meal_name', ''), 
              food_data['calories'], food_data['protein_g'], 
              food_data['carbs_g'], food_data['fat_g']))
        
        # Update daily totals
        cursor.execute("""
            UPDATE daily_tracking
            SET consumed_calories = consumed_calories + ?,
                consumed_protein = consumed_protein + ?,
                consumed_carbs = consumed_carbs + ?,
                consumed_fat = consumed_fat + ?
            WHERE date = ?
        """, (food_data['calories'], food_data['protein_g'], 
              food_data['carbs_g'], food_data['fat_g'], tracking_date))
        
        conn.commit()
        conn.close()
    
    def get_daily_tracking(self, tracking_date: str = None) -> Optional[Dict]:
        """Get daily tracking data including consumed, target, and remaining macros"""
        if tracking_date is None:
            tracking_date = str(date.today())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT consumed_calories, consumed_protein, consumed_carbs, consumed_fat,
                   target_calories, target_protein, target_carbs, target_fat
            FROM daily_tracking
            WHERE date = ?
        """, (tracking_date,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row is None:
            return None
        
        consumed = {
            "calories": round(row[0], 2),
            "protein_g": round(row[1], 2),
            "carbs_g": round(row[2], 2),
            "fat_g": round(row[3], 2)
        }
        
        target = {
            "calories": round(row[4], 2),
            "protein_g": round(row[5], 2),
            "carbs_g": round(row[6], 2),
            "fat_g": round(row[7], 2)
        }
        
        remaining = {
            "calories": round(target["calories"] - consumed["calories"], 2),
            "protein_g": round(target["protein_g"] - consumed["protein_g"], 2),
            "carbs_g": round(target["carbs_g"] - consumed["carbs_g"], 2),
            "fat_g": round(target["fat_g"] - consumed["fat_g"], 2)
        }
        
        return {
            "date": tracking_date,
            "consumed": consumed,
            "target": target,
            "remaining": remaining
        }

# Global database instance
db = MacroDatabase()

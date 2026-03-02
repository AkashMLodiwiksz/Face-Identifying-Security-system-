"""
View all tables and data from the SQLite database
"""
import sqlite3
import os

# Database path
db_path = os.path.join('instance', 'face_recognition.db')

def simple_table(data, headers):
    """Simple table formatter without external dependencies"""
    if not data and not headers:
        return ""
    
    # Calculate column widths
    if headers:
        col_widths = [len(str(h)) for h in headers]
    else:
        col_widths = [0] * len(data[0]) if data else []
    
    for row in data:
        for i, cell in enumerate(row):
            if i < len(col_widths):
                col_widths[i] = max(col_widths[i], len(str(cell)))
    
    # Build table
    lines = []
    
    # Header
    if headers:
        header_line = " | ".join(str(h).ljust(col_widths[i]) for i, h in enumerate(headers))
        lines.append(header_line)
        lines.append("-" * len(header_line))
    
    # Data rows
    for row in data:
        row_line = " | ".join(str(cell).ljust(col_widths[i]) for i, cell in enumerate(row))
        lines.append(row_line)
    
    return "\n".join(lines)

def view_all_tables():
    """Display all tables in the database"""
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = cursor.fetchall()
    
    print("\n" + "="*80)
    print(f"📊 DATABASE: {db_path}")
    print("="*80)
    
    if not tables:
        print("❌ No tables found in the database")
        conn.close()
        return
    
    print(f"\n✅ Found {len(tables)} tables:\n")
    
    for (table_name,) in tables:
        print(f"\n{'='*80}")
        print(f"📋 TABLE: {table_name}")
        print("="*80)
        
        # Get column information
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        
        print("\n📌 Columns:")
        column_headers = ["#", "Name", "Type", "Not Null", "Default", "Primary Key"]
        print(simple_table(columns, column_headers))
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        row_count = cursor.fetchone()[0]
        print(f"\n📊 Total Rows: {row_count}")
        
        # Show sample data (first 5 rows)
        if row_count > 0:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 5;")
            rows = cursor.fetchall()
            col_names = [description[1] for description in columns]
            
            print(f"\n📄 Sample Data (First 5 rows):")
            print(simple_table(rows, col_names))
            
            if row_count > 5:
                print(f"\n... and {row_count - 5} more rows")
    
    conn.close()
    print("\n" + "="*80)
    print("✅ Database view complete!")
    print("="*80 + "\n")


def view_specific_table(table_name):
    """View all data from a specific table"""
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get column information
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        col_names = [col[1] for col in columns]
        
        # Get all data
        cursor.execute(f"SELECT * FROM {table_name};")
        rows = cursor.fetchall()
        
        print(f"\n{'='*80}")
        print(f"📋 TABLE: {table_name}")
        print(f"📊 Total Rows: {len(rows)}")
        print("="*80 + "\n")
        
        if rows:
            print(simple_table(rows, col_names))
        else:
            print("❌ No data found in this table")
            
    except sqlite3.Error as e:
        print(f"❌ Error: {e}")
    
    finally:
        conn.close()


def list_tables_only():
    """Just list all table names"""
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = cursor.fetchall()
    
    print("\n📊 All Tables in Database:")
    print("="*80)
    for i, (table_name,) in enumerate(tables, 1):
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        count = cursor.fetchone()[0]
        print(f"{i:2d}. {table_name:30s} ({count} rows)")
    
    conn.close()
    print("="*80 + "\n")


if __name__ == "__main__":
    import sys
    
    print("\n🔍 SQLite Database Viewer")
    print("="*80)
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--list":
            list_tables_only()
        elif sys.argv[1] == "--table" and len(sys.argv) > 2:
            view_specific_table(sys.argv[2])
        else:
            print("Usage:")
            print("  python view_database.py              - View all tables with sample data")
            print("  python view_database.py --list       - List all tables with row counts")
            print("  python view_database.py --table <name> - View specific table")
    else:
        view_all_tables()

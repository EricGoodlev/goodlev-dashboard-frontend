"""
Goodlev Financial Dashboard Backend
FastAPI application with YNAB integration, auto-categorization, and analytics
Includes: YNAB push functionality, SQLAlchemy for local storage
"""

from fastapi import FastAPI, HTTPException, Depends, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from contextlib import asynccontextmanager
import os
import httpx
import secrets
import json
import re
from decimal import Decimal
from collections import defaultdict

# SQLAlchemy imports
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# =============================================================================
# DATABASE SETUP (SQLAlchemy)
# =============================================================================

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./goodlev.db")

# Handle Railway's postgres:// vs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CategoryRule(Base):
    """Local category rules (from Monarch history)"""
    __tablename__ = "category_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    payee_pattern = Column(String(255), index=True)  # Lowercase pattern to match
    category_name = Column(String(255))  # Target category name
    priority = Column(Integer, default=0)  # Higher = more specific
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CategoryOverride(Base):
    """User-specified category overrides (takes precedence over rules)"""
    __tablename__ = "category_overrides"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(255), unique=True, index=True)  # YNAB transaction ID
    category_id = Column(String(255))  # YNAB category ID
    category_name = Column(String(255))  # Human readable
    created_at = Column(DateTime, default=datetime.utcnow)


class BudgetTarget(Base):
    """Monthly budget targets by category"""
    __tablename__ = "budget_targets"
    
    id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(255), index=True)
    monthly_target = Column(Float)
    is_income = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Create tables
Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =============================================================================
# APP SETUP
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("🚀 Goodlev Backend starting up...")
    # Initialize default rules if empty
    db = SessionLocal()
    if db.query(CategoryRule).count() == 0:
        print("📋 Loading default merchant rules...")
        load_default_rules(db)
    db.close()
    yield
    print("👋 Goodlev Backend shutting down...")


app = FastAPI(
    title="Goodlev Financial Dashboard API",
    description="YNAB integration with auto-categorization and financial analytics",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins + ["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBasic()

def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify basic auth credentials"""
    correct_username = os.getenv("DASHBOARD_USERNAME", "goodlev")
    correct_password = os.getenv("DASHBOARD_PASSWORD", "changeme")
    
    is_correct_username = secrets.compare_digest(credentials.username, correct_username)
    is_correct_password = secrets.compare_digest(credentials.password, correct_password)
    
    if not (is_correct_username and is_correct_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username


def get_api_key(x_api_key: Optional[str] = Header(None)):
    """Optional API key authentication"""
    expected_key = os.getenv("API_KEY")
    if expected_key and x_api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


# =============================================================================
# YNAB CLIENT
# =============================================================================

class YNABClient:
    """YNAB API client"""
    
    BASE_URL = "https://api.ynab.com/v1"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    async def _request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Make API request"""
        async with httpx.AsyncClient() as client:
            url = f"{self.BASE_URL}{endpoint}"
            response = await client.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data,
                timeout=30.0
            )
            
            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid YNAB access token")
            elif response.status_code == 404:
                raise HTTPException(status_code=404, detail="YNAB resource not found")
            elif response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return response.json()
    
    async def get_budgets(self) -> dict:
        """Get all budgets"""
        return await self._request("GET", "/budgets")
    
    async def get_budget(self, budget_id: str = "last-used") -> dict:
        """Get budget details"""
        return await self._request("GET", f"/budgets/{budget_id}")
    
    async def get_accounts(self, budget_id: str = "last-used") -> dict:
        """Get all accounts"""
        return await self._request("GET", f"/budgets/{budget_id}/accounts")
    
    async def get_categories(self, budget_id: str = "last-used") -> dict:
        """Get all categories"""
        return await self._request("GET", f"/budgets/{budget_id}/categories")
    
    async def get_transactions(
        self, 
        budget_id: str = "last-used",
        since_date: str = None,
        account_id: str = None,
        category_id: str = None
    ) -> dict:
        """Get transactions with optional filters"""
        endpoint = f"/budgets/{budget_id}/transactions"
        params = []
        if since_date:
            params.append(f"since_date={since_date}")
        if params:
            endpoint += "?" + "&".join(params)
        return await self._request("GET", endpoint)
    
    async def get_uncategorized_transactions(
        self,
        budget_id: str = "last-used",
        since_date: str = None
    ) -> List[dict]:
        """Get transactions without categories (excluding transfers)"""
        result = await self.get_transactions(budget_id, since_date)
        transactions = result.get("data", {}).get("transactions", [])
        
        uncategorized = []
        for t in transactions:
            # Skip transfers (payee starts with "Transfer")
            if t.get("payee_name", "").startswith("Transfer"):
                continue
            # Skip if has category
            if t.get("category_id") and t.get("category_name") != "Uncategorized":
                continue
            # Skip Starting Balance
            if "Starting Balance" in t.get("payee_name", ""):
                continue
            uncategorized.append(t)
        
        return uncategorized
    
    async def update_transaction(
        self,
        budget_id: str,
        transaction_id: str,
        category_id: str = None,
        payee_name: str = None,
        memo: str = None,
        flag_color: str = None
    ) -> dict:
        """Update a single transaction in YNAB"""
        data = {"transaction": {}}
        
        if category_id:
            data["transaction"]["category_id"] = category_id
        if payee_name:
            data["transaction"]["payee_name"] = payee_name
        if memo is not None:
            data["transaction"]["memo"] = memo
        if flag_color:
            data["transaction"]["flag_color"] = flag_color
        
        return await self._request(
            "PUT",
            f"/budgets/{budget_id}/transactions/{transaction_id}",
            data
        )
    
    async def update_transactions_bulk(
        self,
        budget_id: str,
        transactions: List[dict]
    ) -> dict:
        """Bulk update transactions in YNAB
        
        Each transaction dict should have:
        - id: transaction ID
        - category_id: (optional) new category
        - payee_name: (optional) new payee
        - memo: (optional) new memo
        """
        data = {"transactions": transactions}
        return await self._request(
            "PATCH",
            f"/budgets/{budget_id}/transactions",
            data
        )


def get_ynab_client() -> YNABClient:
    """Get YNAB client from environment"""
    token = os.getenv("YNAB_ACCESS_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="YNAB_ACCESS_TOKEN not configured")
    return YNABClient(token)


# =============================================================================
# MERCHANT RULES (from Monarch history)
# =============================================================================

DEFAULT_MERCHANT_RULES = {
    # Housing
    'firstrust': 'Mortgage',
    'firstrust bank': 'Mortgage',
    'pnc': 'HELOC',
    'pnc bank': 'HELOC',
    'pnc mortgage': 'HELOC',
    
    # Healthcare/Therapy  
    'gruenberg': 'Therapy',
    'gruenberg and summers': 'Therapy',
    'main line int': 'Therapy',
    'main line integrated': 'Therapy',
    'cvs': 'Medical',
    'cvs pharmacy': 'Medical',
    'rite aid': 'Medical',
    'walgreens': 'Medical',
    
    # Transportation
    'volvo': 'Auto Payment',
    'hyundai': 'Auto Payment',
    'kia': 'Auto Payment',
    'geico': 'Insurance',
    'shell': 'Gas',
    'wawa': 'Gas',
    'exxon': 'Gas',
    'sunoco': 'Gas',
    'bp': 'Gas',
    'speedway': 'Gas',
    'uber': 'Taxi & Ride Shares',
    'lyft': 'Taxi & Ride Shares',
    'parkwhiz': 'Parking & Tolls',
    'ez pass': 'Parking & Tolls',
    'pa turnpike': 'Parking & Tolls',
    
    # Childcare
    'right at school': 'Child Care',
    'lineleader': 'Child Care',
    'greenlight': 'Child Care',
    'camp kef': 'Child Activities',
    'camp ramah': 'Child Activities',
    
    # Utilities
    'peco': 'Gas & Electric',
    'aqua': 'Gas & Electric',
    'aqua pennsylvania': 'Gas & Electric',
    'comcast': 'Internet & Cable',
    'xfinity': 'Internet & Cable',
    'verizon': 'Internet & Cable',
    
    # Home
    'simplisafe': 'Home Security',
    'homeserve': 'Insurance',
    
    # Food
    'whole foods': 'Groceries',
    'trader joe': 'Groceries',
    "trader joe's": 'Groceries',
    'wegmans': 'Groceries',
    'giant': 'Groceries',
    'acme': 'Groceries',
    'costco': 'Groceries',
    "mom's organic": 'Groceries',
    'target': 'Shopping',
    'amazon': 'Shopping',
    'amazon prime': 'Shopping',
    'starbucks': 'Coffee Shops',
    'dunkin': 'Coffee Shops',
    'wawa coffee': 'Coffee Shops',
    
    # Fitness
    'crossfit': 'Fitness',
    'planet fitness': 'Fitness',
    'wodify': 'Fitness',
    
    # Insurance
    'equitable': 'Insurance',
    'chubb': 'Insurance',
    'standard ins': 'Insurance',
    
    # Streaming
    'netflix': 'Streaming',
    'spotify': 'Streaming',
    'hulu': 'Streaming',
    'disney+': 'Streaming',
    'disney plus': 'Streaming',
    'apple tv': 'Streaming',
    'hbo': 'Streaming',
    'amazon prime video': 'Streaming',
    
    # Income
    'fox chase': 'Paychecks',
    'temple health': 'Paychecks',
    'beth david': 'Paychecks',
    'bdrc': 'Paychecks',
}


def load_default_rules(db: Session):
    """Load default merchant rules into database"""
    for pattern, category in DEFAULT_MERCHANT_RULES.items():
        rule = CategoryRule(
            payee_pattern=pattern.lower(),
            category_name=category,
            priority=len(pattern)  # Longer patterns = more specific = higher priority
        )
        db.add(rule)
    db.commit()


def match_payee_to_category(payee_name: str, db: Session) -> Optional[str]:
    """Match payee to category using rules"""
    if not payee_name:
        return None
    
    payee_lower = payee_name.lower()
    
    # Get all rules, ordered by priority (descending)
    rules = db.query(CategoryRule).order_by(CategoryRule.priority.desc()).all()
    
    for rule in rules:
        if rule.payee_pattern in payee_lower:
            return rule.category_name
    
    return None


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class TransactionUpdate(BaseModel):
    transaction_id: str
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    memo: Optional[str] = None


class BulkCategorizeRequest(BaseModel):
    dry_run: bool = True
    days: int = 30


class CategoryRuleCreate(BaseModel):
    payee_pattern: str
    category_name: str
    priority: Optional[int] = None


class BudgetTargetCreate(BaseModel):
    category_name: str
    monthly_target: float
    is_income: bool = False


# =============================================================================
# TRANSACTION FILTERING HELPERS
# =============================================================================

def is_real_transaction(t: dict) -> bool:
    """
    Filter out non-real transactions that shouldn't count toward income/expenses.
    
    Excludes:
    - Starting Balance (account initialization)
    - Transfers between accounts (have transfer_account_id or payee starts with "Transfer")
    - Reconciliation Balance Adjustments
    """
    payee = t.get("payee_name", "") or ""
    
    # Skip Starting Balance transactions
    if "Starting Balance" in payee:
        return False
    
    # Skip reconciliation adjustments
    if "Reconciliation Balance Adjustment" in payee:
        return False
    
    # Skip transfers between accounts (YNAB marks these with transfer_account_id)
    if t.get("transfer_account_id"):
        return False
    
    # Skip transfers (payee name pattern)
    if payee.startswith("Transfer"):
        return False
    
    return True


def filter_real_transactions(transactions: list) -> list:
    """Filter a list of transactions to only include real income/expenses."""
    return [t for t in transactions if is_real_transaction(t)]


# =============================================================================
# HEALTH & INFO ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "goodlev-dashboard-api",
        "version": "2.0.0",
        "features": ["ynab", "autocategorize", "analytics", "push"]
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "ynab_configured": bool(os.getenv("YNAB_ACCESS_TOKEN")),
        "database": "connected"
    }


# =============================================================================
# YNAB DATA ENDPOINTS
# =============================================================================

@app.get("/api/budgets")
async def get_budgets():
    """Get all YNAB budgets"""
    client = get_ynab_client()
    return await client.get_budgets()


@app.get("/api/budget")
async def get_budget(budget_id: str = "last-used"):
    """Get budget details"""
    client = get_ynab_client()
    return await client.get_budget(budget_id)


@app.get("/api/accounts")
async def get_accounts(budget_id: str = "last-used"):
    """Get all accounts"""
    client = get_ynab_client()
    result = await client.get_accounts(budget_id)
    
    # Add some computed fields
    accounts = result.get("data", {}).get("accounts", [])
    for acc in accounts:
        # Convert milliunits to dollars
        acc["balance_dollars"] = acc.get("balance", 0) / 1000
        acc["cleared_balance_dollars"] = acc.get("cleared_balance", 0) / 1000
    
    return result


@app.get("/api/categories")
async def get_categories(budget_id: str = "last-used"):
    """Get all categories"""
    client = get_ynab_client()
    return await client.get_categories(budget_id)


@app.get("/api/transactions")
async def get_transactions(
    budget_id: str = "last-used",
    days: int = 30,
    since_date: Optional[str] = None,
    exclude_transfers: bool = True,
    exclude_starting_balance: bool = True
):
    """Get transactions with optional filtering.
    
    Args:
        exclude_transfers: Filter out transfers between accounts (default: True)
        exclude_starting_balance: Filter out Starting Balance entries (default: True)
    """
    client = get_ynab_client()
    
    if not since_date:
        since_date = (date.today() - timedelta(days=days)).isoformat()
    
    result = await client.get_transactions(budget_id, since_date)
    
    # Get transactions
    transactions = result.get("data", {}).get("transactions", [])
    
    # Apply filters if requested
    if exclude_transfers or exclude_starting_balance:
        filtered = []
        for t in transactions:
            payee = t.get("payee_name", "") or ""
            
            # Skip Starting Balance if excluded
            if exclude_starting_balance and "Starting Balance" in payee:
                continue
            
            # Skip Reconciliation Balance Adjustment
            if exclude_starting_balance and "Reconciliation Balance Adjustment" in payee:
                continue
            
            # Skip transfers if excluded
            if exclude_transfers:
                if t.get("transfer_account_id"):
                    continue
                if payee.startswith("Transfer"):
                    continue
            
            filtered.append(t)
        transactions = filtered
    
    # Convert milliunits and add computed fields
    for t in transactions:
        t["amount_dollars"] = t.get("amount", 0) / 1000
    
    # Return filtered result
    result["data"]["transactions"] = transactions
    return result


# =============================================================================
# AUTO-CATEGORIZATION ENDPOINTS
# =============================================================================

@app.get("/api/autocategorize/preview")
async def preview_autocategorize(
    budget_id: str = "last-used",
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Preview what auto-categorization would do"""
    client = get_ynab_client()
    since_date = (date.today() - timedelta(days=days)).isoformat()
    
    # Get uncategorized transactions
    uncategorized = await client.get_uncategorized_transactions(budget_id, since_date)
    
    # Get YNAB categories for mapping
    cat_result = await client.get_categories(budget_id)
    category_groups = cat_result.get("data", {}).get("category_groups", [])
    
    # Build category name -> ID map
    category_map = {}
    for group in category_groups:
        for cat in group.get("categories", []):
            category_map[cat["name"].lower()] = {
                "id": cat["id"],
                "name": cat["name"],
                "group": group["name"]
            }
    
    # Match transactions
    would_categorize = []
    no_match = []
    no_category_in_ynab = []
    
    for t in uncategorized:
        payee = t.get("payee_name", "")
        matched_category = match_payee_to_category(payee, db)
        
        if matched_category:
            # Check if category exists in YNAB
            ynab_cat = category_map.get(matched_category.lower())
            if ynab_cat:
                would_categorize.append({
                    "transaction_id": t["id"],
                    "payee": payee,
                    "amount": t.get("amount", 0) / 1000,
                    "date": t.get("date"),
                    "matched_category": matched_category,
                    "ynab_category_id": ynab_cat["id"],
                    "ynab_category_name": ynab_cat["name"]
                })
            else:
                no_category_in_ynab.append({
                    "payee": payee,
                    "amount": t.get("amount", 0) / 1000,
                    "date": t.get("date"),
                    "matched_category": matched_category
                })
        else:
            no_match.append({
                "transaction_id": t["id"],
                "payee": payee,
                "amount": t.get("amount", 0) / 1000,
                "date": t.get("date")
            })
    
    return {
        "summary": {
            "total_uncategorized": len(uncategorized),
            "would_categorize": len(would_categorize),
            "no_match": len(no_match),
            "missing_ynab_category": len(no_category_in_ynab)
        },
        "would_categorize": would_categorize,
        "no_match": no_match,
        "no_category_in_ynab": no_category_in_ynab
    }


@app.post("/api/autocategorize/run")
async def run_autocategorize(
    request: BulkCategorizeRequest,
    budget_id: str = "last-used",
    db: Session = Depends(get_db)
):
    """Run auto-categorization (with YNAB push)"""
    client = get_ynab_client()
    since_date = (date.today() - timedelta(days=request.days)).isoformat()
    
    # Get preview first
    preview = await preview_autocategorize(budget_id, request.days, db)
    
    if request.dry_run:
        return {
            "dry_run": True,
            "message": "No changes made. Set dry_run=false to apply.",
            **preview
        }
    
    # Apply categorizations via YNAB API
    to_update = preview["would_categorize"]
    
    if not to_update:
        return {
            "dry_run": False,
            "updated": 0,
            "message": "No transactions to categorize"
        }
    
    # Build bulk update payload
    transactions_to_update = [
        {
            "id": t["transaction_id"],
            "category_id": t["ynab_category_id"]
        }
        for t in to_update
    ]
    
    # Push to YNAB
    result = await client.update_transactions_bulk(budget_id, transactions_to_update)
    
    return {
        "dry_run": False,
        "updated": len(to_update),
        "message": f"Successfully categorized {len(to_update)} transactions",
        "transactions": to_update,
        "ynab_response": result
    }


@app.get("/api/autocategorize/rules")
async def get_rules(db: Session = Depends(get_db)):
    """Get all category rules"""
    rules = db.query(CategoryRule).order_by(CategoryRule.priority.desc()).all()
    return {
        "count": len(rules),
        "rules": [
            {
                "id": r.id,
                "payee_pattern": r.payee_pattern,
                "category_name": r.category_name,
                "priority": r.priority
            }
            for r in rules
        ]
    }


@app.post("/api/autocategorize/rules")
async def add_rule(rule: CategoryRuleCreate, db: Session = Depends(get_db)):
    """Add a new category rule"""
    priority = rule.priority if rule.priority else len(rule.payee_pattern)
    
    new_rule = CategoryRule(
        payee_pattern=rule.payee_pattern.lower(),
        category_name=rule.category_name,
        priority=priority
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    
    return {"message": "Rule added", "rule": {
        "id": new_rule.id,
        "payee_pattern": new_rule.payee_pattern,
        "category_name": new_rule.category_name,
        "priority": new_rule.priority
    }}


@app.delete("/api/autocategorize/rules/{rule_id}")
async def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete a category rule"""
    rule = db.query(CategoryRule).filter(CategoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted", "id": rule_id}


# =============================================================================
# SINGLE TRANSACTION UPDATE (YNAB PUSH)
# =============================================================================

@app.put("/api/transactions/{transaction_id}")
async def update_transaction(
    transaction_id: str,
    update: TransactionUpdate,
    budget_id: str = "last-used",
    db: Session = Depends(get_db)
):
    """Update a single transaction in YNAB"""
    client = get_ynab_client()
    
    # If category_name provided, look up category_id
    category_id = update.category_id
    if update.category_name and not category_id:
        cat_result = await client.get_categories(budget_id)
        category_groups = cat_result.get("data", {}).get("category_groups", [])
        
        for group in category_groups:
            for cat in group.get("categories", []):
                if cat["name"].lower() == update.category_name.lower():
                    category_id = cat["id"]
                    break
            if category_id:
                break
        
        if not category_id:
            raise HTTPException(
                status_code=404, 
                detail=f"Category '{update.category_name}' not found in YNAB"
            )
    
    # Push to YNAB
    result = await client.update_transaction(
        budget_id=budget_id,
        transaction_id=transaction_id,
        category_id=category_id,
        memo=update.memo
    )
    
    # Store override locally
    if category_id:
        override = db.query(CategoryOverride).filter(
            CategoryOverride.transaction_id == transaction_id
        ).first()
        
        if override:
            override.category_id = category_id
            override.category_name = update.category_name or ""
        else:
            override = CategoryOverride(
                transaction_id=transaction_id,
                category_id=category_id,
                category_name=update.category_name or ""
            )
            db.add(override)
        db.commit()
    
    return {
        "message": "Transaction updated",
        "transaction_id": transaction_id,
        "category_id": category_id,
        "ynab_response": result
    }


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@app.get("/api/analytics/monthly-summary")
async def get_monthly_summary(
    budget_id: str = "last-used",
    year: int = None,
    month: int = None
):
    """Get monthly spending summary by category"""
    client = get_ynab_client()
    
    # Default to current month
    today = date.today()
    year = year or today.year
    month = month or today.month
    
    # Calculate date range
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    # Get transactions
    result = await client.get_transactions(budget_id, start_date.isoformat())
    transactions = result.get("data", {}).get("transactions", [])
    
    # Filter out Starting Balance, transfers, and reconciliation adjustments
    real_transactions = filter_real_transactions(transactions)
    
    # Filter to month and aggregate
    by_category = defaultdict(lambda: {"amount": 0, "count": 0, "transactions": []})
    total_income = 0
    total_expense = 0
    
    for t in real_transactions:
        t_date = datetime.strptime(t["date"], "%Y-%m-%d").date()
        if t_date < start_date or t_date > end_date:
            continue
        
        amount = t.get("amount", 0) / 1000  # Convert milliunits
        category = t.get("category_name") or "Uncategorized"
        
        by_category[category]["amount"] += amount
        by_category[category]["count"] += 1
        by_category[category]["transactions"].append({
            "id": t["id"],
            "payee": t.get("payee_name"),
            "amount": amount,
            "date": t["date"]
        })
        
        if amount > 0:
            total_income += amount
        else:
            total_expense += abs(amount)
    
    # Sort by absolute amount
    sorted_categories = sorted(
        by_category.items(),
        key=lambda x: abs(x[1]["amount"]),
        reverse=True
    )
    
    return {
        "year": year,
        "month": month,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net": round(total_income - total_expense, 2),
        "categories": [
            {
                "name": name,
                "amount": round(data["amount"], 2),
                "count": data["count"],
                "transactions": data["transactions"][:5]  # Top 5 only
            }
            for name, data in sorted_categories
        ]
    }


@app.get("/api/analytics/spending-trends")
async def get_spending_trends(
    budget_id: str = "last-used",
    months: int = 6,
    db: Session = Depends(get_db)
):
    """Get spending trends over time"""
    client = get_ynab_client()
    
    # Calculate date range
    today = date.today()
    start_date = date(today.year, today.month, 1) - timedelta(days=30 * months)
    
    result = await client.get_transactions(budget_id, start_date.isoformat())
    transactions = result.get("data", {}).get("transactions", [])
    
    # Filter out Starting Balance, transfers, and reconciliation adjustments
    real_transactions = filter_real_transactions(transactions)
    
    # Aggregate by month and category
    monthly_data = defaultdict(lambda: defaultdict(float))
    
    for t in real_transactions:
        t_date = datetime.strptime(t["date"], "%Y-%m-%d").date()
        month_key = f"{t_date.year}-{t_date.month:02d}"
        category = t.get("category_name") or "Uncategorized"
        amount = t.get("amount", 0) / 1000
        
        monthly_data[month_key][category] += amount
        monthly_data[month_key]["_total"] += amount
        if amount > 0:
            monthly_data[month_key]["_income"] += amount
        else:
            monthly_data[month_key]["_expense"] += abs(amount)
    
    # Format for response
    months_list = sorted(monthly_data.keys())
    
    return {
        "months": [
            {
                "month": m,
                "total": round(monthly_data[m]["_total"], 2),
                "income": round(monthly_data[m].get("_income", 0), 2),
                "expense": round(monthly_data[m].get("_expense", 0), 2),
                "top_categories": sorted(
                    [
                        {"name": k, "amount": round(v, 2)}
                        for k, v in monthly_data[m].items()
                        if not k.startswith("_")
                    ],
                    key=lambda x: abs(x["amount"]),
                    reverse=True
                )[:10]
            }
            for m in months_list
        ],
        "data_available_from": months_list[0] if months_list else None,
        "data_available_to": months_list[-1] if months_list else None
    }


@app.get("/api/analytics/heloc-analysis")
async def heloc_analysis(
    principal: float = 275809,
    rate: float = 0.0632,
    current_payment: float = 1546,
    draw_period_end: str = "2032-01-01"
):
    """HELOC payoff analysis with different extra payment scenarios"""
    
    monthly_rate = rate / 12
    draw_end = datetime.strptime(draw_period_end, "%Y-%m-%d").date()
    months_in_draw = max(0, (draw_end.year - date.today().year) * 12 + (draw_end.month - date.today().month))
    
    scenarios = []
    extra_payments = [0, 500, 1000, 1500, 2000, 2500, 3000]
    
    for extra in extra_payments:
        total_payment = current_payment + extra
        balance = principal
        months = 0
        total_interest = 0
        
        # Simulate payoff
        while balance > 0 and months < 360:  # Max 30 years
            interest = balance * monthly_rate
            principal_payment = total_payment - interest
            
            if principal_payment <= 0:
                # Payment doesn't cover interest
                break
            
            if principal_payment > balance:
                principal_payment = balance
            
            balance -= principal_payment
            total_interest += interest
            months += 1
        
        payoff_date = date.today() + timedelta(days=months * 30)
        
        scenarios.append({
            "extra_payment": extra,
            "total_monthly": total_payment,
            "payoff_months": months,
            "payoff_date": payoff_date.isoformat(),
            "total_interest": round(total_interest, 2),
            "total_paid": round(principal + total_interest, 2),
            "interest_saved_vs_minimum": round(
                scenarios[0]["total_interest"] - total_interest, 2
            ) if scenarios else 0,
            "paid_before_draw_end": payoff_date < draw_end
        })
    
    return {
        "current_balance": principal,
        "interest_rate": rate,
        "current_payment": current_payment,
        "draw_period_ends": draw_period_end,
        "months_remaining_in_draw": months_in_draw,
        "scenarios": scenarios
    }


@app.get("/api/analytics/retirement-projection")
async def retirement_projection(
    current_balance: float = 500000,
    annual_contribution: float = 41225,
    target_age: int = 60,
    current_age: int = 40,
    return_rate: float = 0.07,
    inflation_rate: float = 0.03
):
    """Retirement projection calculator"""
    
    years_to_retirement = target_age - current_age
    
    # Project balance year by year
    projections = []
    balance = current_balance
    
    for year in range(years_to_retirement + 1):
        age = current_age + year
        
        # Add contribution (except year 0)
        if year > 0:
            balance = balance * (1 + return_rate) + annual_contribution
        
        # Calculate inflation-adjusted value
        real_value = balance / ((1 + inflation_rate) ** year)
        
        projections.append({
            "year": year,
            "age": age,
            "nominal_balance": round(balance, 2),
            "real_balance": round(real_value, 2)
        })
    
    final_balance = projections[-1]["nominal_balance"]
    final_real = projections[-1]["real_balance"]
    
    # 4% rule withdrawal
    safe_withdrawal = final_balance * 0.04
    safe_withdrawal_real = final_real * 0.04
    
    return {
        "current_balance": current_balance,
        "annual_contribution": annual_contribution,
        "years_to_retirement": years_to_retirement,
        "assumed_return": return_rate,
        "assumed_inflation": inflation_rate,
        "projected_balance_at_retirement": round(final_balance, 2),
        "inflation_adjusted_balance": round(final_real, 2),
        "safe_annual_withdrawal_4pct": round(safe_withdrawal, 2),
        "safe_withdrawal_real": round(safe_withdrawal_real, 2),
        "safe_monthly_withdrawal": round(safe_withdrawal / 12, 2),
        "projections": projections
    }


@app.get("/api/analytics/budget-vs-actual")
async def budget_vs_actual(
    budget_id: str = "last-used",
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db)
):
    """Compare actual spending to budget targets"""
    client = get_ynab_client()
    
    # Get monthly summary
    today = date.today()
    year = year or today.year
    month = month or today.month
    
    summary = await get_monthly_summary(budget_id, year, month)
    
    # Get budget targets
    targets = db.query(BudgetTarget).all()
    target_map = {t.category_name.lower(): t.monthly_target for t in targets}
    
    # Get YNAB category budgets
    cat_result = await client.get_categories(budget_id)
    category_groups = cat_result.get("data", {}).get("category_groups", [])
    
    ynab_budgets = {}
    for group in category_groups:
        for cat in group.get("categories", []):
            if cat.get("budgeted"):
                ynab_budgets[cat["name"].lower()] = cat["budgeted"] / 1000
    
    # Build comparison
    comparisons = []
    for cat_data in summary["categories"]:
        name = cat_data["name"]
        actual = abs(cat_data["amount"])  # Use absolute for comparison
        
        # Get budget (prefer local target, fall back to YNAB)
        budget = target_map.get(name.lower()) or ynab_budgets.get(name.lower()) or 0
        
        variance = budget - actual if budget else None
        variance_pct = (variance / budget * 100) if budget and budget != 0 else None
        
        comparisons.append({
            "category": name,
            "budgeted": round(budget, 2) if budget else None,
            "actual": round(actual, 2),
            "variance": round(variance, 2) if variance is not None else None,
            "variance_pct": round(variance_pct, 1) if variance_pct is not None else None,
            "status": "over" if variance and variance < 0 else "under" if variance and variance > 0 else "on_track"
        })
    
    return {
        "year": year,
        "month": month,
        "total_budgeted": sum(c["budgeted"] or 0 for c in comparisons),
        "total_actual": summary["total_expense"],
        "comparisons": sorted(comparisons, key=lambda x: abs(x["actual"]), reverse=True)
    }


# =============================================================================
# BUDGET TARGETS ENDPOINTS
# =============================================================================

@app.get("/api/budget-targets")
async def get_budget_targets(db: Session = Depends(get_db)):
    """Get all budget targets"""
    targets = db.query(BudgetTarget).all()
    return {
        "targets": [
            {
                "id": t.id,
                "category_name": t.category_name,
                "monthly_target": t.monthly_target,
                "is_income": t.is_income
            }
            for t in targets
        ]
    }


@app.post("/api/budget-targets")
async def set_budget_target(target: BudgetTargetCreate, db: Session = Depends(get_db)):
    """Set a budget target"""
    existing = db.query(BudgetTarget).filter(
        BudgetTarget.category_name == target.category_name
    ).first()
    
    if existing:
        existing.monthly_target = target.monthly_target
        existing.is_income = target.is_income
    else:
        new_target = BudgetTarget(
            category_name=target.category_name,
            monthly_target=target.monthly_target,
            is_income=target.is_income
        )
        db.add(new_target)
    
    db.commit()
    return {"message": "Budget target set", "category": target.category_name}


@app.delete("/api/budget-targets/{category_name}")
async def delete_budget_target(category_name: str, db: Session = Depends(get_db)):
    """Delete a budget target"""
    target = db.query(BudgetTarget).filter(
        BudgetTarget.category_name == category_name
    ).first()
    
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    
    db.delete(target)
    db.commit()
    return {"message": "Target deleted", "category": category_name}


# =============================================================================
# BATCH IMPORT RULES
# =============================================================================

@app.post("/api/autocategorize/rules/import")
async def import_rules(
    rules: List[CategoryRuleCreate],
    replace: bool = False,
    db: Session = Depends(get_db)
):
    """Bulk import category rules"""
    if replace:
        db.query(CategoryRule).delete()
    
    imported = 0
    for rule in rules:
        priority = rule.priority if rule.priority else len(rule.payee_pattern)
        new_rule = CategoryRule(
            payee_pattern=rule.payee_pattern.lower(),
            category_name=rule.category_name,
            priority=priority
        )
        db.add(new_rule)
        imported += 1
    
    db.commit()
    return {"message": f"Imported {imported} rules", "replaced_existing": replace}


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))

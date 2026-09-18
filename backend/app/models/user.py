from sqlalchemy import Column, Integer, String, DateTime, Date
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func


class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)       
    dateHired = Column(Date, nullable=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="staff")
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, server_default=func.now())
    
    transactions = relationship("Transaction", back_populates="user")
    restock_history = relationship("RestockHistory", back_populates="user")
    
    # Not sure
    def is_admin(self): 
        return self.role == "admin"
    
    def is_staff(self):
        return self.role in ["admin", "staff"]
    
    
    
    
    



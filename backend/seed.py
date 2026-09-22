import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from app.utils.security import hash_password
from sqlalchemy.future import select

async def seed_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            print("Admin user already exists. Skipping seeding.")
            return

        admin = User(
            username="admin",
            email="admin@puppetsdirectory.com",
            password=hash_password("admin123"),
            role="admin"
        )

        db.add(admin)
        await db.commit()
        print("Admin user seeded successfully.")
        print("Username: admin")
        print("Password: admin123")


async def seed_manufacturer():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "manufacturer"))
        existing_manufacturer = result.scalar_one_or_none()

        if existing_manufacturer:
            print("Manufacturer user already exists. Skipping seeding.")
            return

        manufacturer = User(
            username="manufacturer",
            email="manufacturer@puppetsdirectory.com",
            password=hash_password("manufacturer123"),
            role="manufacturer"
        )

        db.add(manufacturer)
        await db.commit()
        print("Manufacturer user seeded successfully.")
        print("Username: manufacturer")
        print("Password: manufacturer123")


async def seed_all():
    await seed_admin()
    await seed_manufacturer()


if __name__ == "__main__":
    asyncio.run(seed_all())
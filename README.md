# MeterMate

MeterMate is a backend-first foundation for a landlord electricity meter tracking app. It is designed to support any number of meters per property, monthly reading capture, bill calculation, and a clean service-layer architecture for future APIs.

## What Has Been Built

- Spring Boot backend foundation with Java 21 and Spring Boot 3.3.5
- Domain entities for Property, Meter, MonthlyReading, and Settings
- JPA repositories for all four entities
- Global API error handling with a shared error response shape
- Profile-based datasource configuration for local H2 and PostgreSQL
- Starter test that confirms the application context loads

## Tech Stack

- Java 21
- Spring Boot 3
- Spring Data JPA
- PostgreSQL
- Maven Wrapper
- Lombok

## Folder Structure

```text
backend/
  pom.xml
  src/main/java/com/metermate/
	 config/
	 controller/
	 dto/
	 entity/
	 exception/
	 mapper/
	 repository/
	 service/
	 util/
  src/main/resources/
  src/test/java/com/metermate/
```

## Setup

1. Make sure Java 21 and Maven are installed.
2. Open a terminal in `backend/`.
3. Generate the Maven Wrapper if needed:

	```powershell
	mvn -N wrapper:wrapper
	```

4. Start the application in the local profile:

	```powershell
	mvn spring-boot:run
	```

5. To use PostgreSQL, activate the postgres profile and provide environment variables:

	- `DB_URL`
	- `DB_USERNAME`
	- `DB_PASSWORD`

## How To Run Tests

Run the backend tests from the `backend/` directory:

```powershell
mvn test
```

That command compiles the project, starts the Spring Boot test context, and verifies the application boots successfully with the local H2 profile.

## Notes

- The backend currently includes the domain entities, repositories, DTO package, and global exception handling foundation.
- Local development starts with an in-memory H2 database so the application boots without requiring a running PostgreSQL server.
- Switch to the `postgres` profile when you are ready to connect to PostgreSQL.



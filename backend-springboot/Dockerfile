FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/arogya-rural-backend-1.0.0.jar app.jar
COPY data/render-demo-locations.csv data/render-demo-locations.csv

EXPOSE 10000
ENTRYPOINT ["java", "-jar", "app.jar"]

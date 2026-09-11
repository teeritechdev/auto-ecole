# --- Étape de build ---
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

# Les dépendances sont mises en cache tant que le pom.xml ne change pas
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Étape d'exécution ---
# Image Alpine : wget (busybox) est disponible nativement pour le healthcheck.
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN adduser -S -D -H appuser
COPY --from=build /app/target/auto-ecole-backend-*.jar app.jar
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

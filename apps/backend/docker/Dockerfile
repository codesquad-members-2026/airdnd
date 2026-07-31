# Runtime image for the airdnd Spring Boot backend.
#
# WHAT: a thin "JRE + jar" image. The CI workflow builds the boot jar with
#       Gradle (where the tests run), drops it next to this file as app.jar,
#       then builds this image. We do NOT compile inside Docker.
# WHY:  the jar is JVM bytecode — architecture-independent — so the same jar
#       runs on the arm64 (t4g) box. The base image is multi-arch, so building
#       for linux/arm64 is just "pick the arm64 JRE + copy the jar".
# HOW:  prod config (DB URL, secrets, SPRING_PROFILES_ACTIVE=prod) is injected
#       at `docker run` time via --env-file, which the deploy script builds
#       from SSM Parameter Store. Nothing secret is baked into the image.

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app
COPY app.jar app.jar

EXPOSE 8080

# Run the JVM in KST. The whole app uses LocalDateTime.now() (zone-dependent),
# and the DB's TIMESTAMP columns convert via the JDBC serverTimezone=Asia/Seoul.
# Default container TZ is UTC, so without this, reservation holds are written and
# compared ~9h off and every hold looks already-expired. -Duser.timezone is
# authoritative for Java (JDK-bundled tz data, no OS tzdata needed); TZ keeps
# OS-level timestamps (logs) aligned too.
ENV TZ="Asia/Seoul"

# Cap the heap to a share of the box's RAM so the JVM stays well-behaved on a
# small instance (t4g.small = 2 GiB). Override by setting JAVA_OPTS at runtime.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70.0 -Duser.timezone=Asia/Seoul"

# `exec` makes java PID 1 so it receives SIGTERM and shuts down gracefully.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]

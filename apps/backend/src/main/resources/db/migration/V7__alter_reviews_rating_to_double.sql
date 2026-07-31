-- The Review entity maps `rating` as a double, but the V1 baseline created the
-- column as INT and no migration ever altered it. Under prod's
-- `ddl-auto: validate` Hibernate expects float(53) and rejects the int column,
-- so the app fails to start. Align the column with the entity here.
-- (Local dev with ddl-auto: update/H2 auto-adjusted the column, which is why
-- this never surfaced before the first validate-mode deploy.)
--
-- Hibernate's Java double maps to float(53), which MySQL realizes as DOUBLE.
ALTER TABLE reviews
    MODIFY COLUMN rating DOUBLE NOT NULL COMMENT '1 ~ 5점';

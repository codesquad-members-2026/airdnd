ALTER TABLE payment ADD canceled_at DATETIME NULL;
ALTER TABLE payment ADD cancel_reason VARCHAR(200) NULL;
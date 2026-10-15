CREATE TABLE `spweb_rate_limit_buckets` (
	`bucketKey` varchar(64) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`windowStartedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `spweb_rate_limit_buckets_bucketKey` PRIMARY KEY(`bucketKey`)
);
--> statement-breakpoint
CREATE INDEX `spweb_rate_limit_expires_idx` ON `spweb_rate_limit_buckets` (`expiresAt`);
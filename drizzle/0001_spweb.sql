CREATE TABLE `spweb_admin_sessions` (
	`tokenHash` varchar(64) NOT NULL,
	`csrfHash` varchar(64) NOT NULL,
	`adminEmail` varchar(320) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spweb_admin_sessions_tokenHash` PRIMARY KEY(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `spweb_leads` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`company` varchar(180) NOT NULL,
	`whatsapp` varchar(24) NOT NULL,
	`email` varchar(320) NOT NULL,
	`revenueBand` varchar(40) NOT NULL,
	`message` text,
	`consent` int NOT NULL DEFAULT 1,
	`consentAt` timestamp NOT NULL,
	`source` varchar(100),
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`ipHash` varchar(64) NOT NULL,
	`userAgentSummary` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spweb_leads_id` PRIMARY KEY(`id`)
);

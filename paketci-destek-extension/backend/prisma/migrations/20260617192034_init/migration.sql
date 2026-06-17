-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'normal', 'high', 'urgent', 'critical');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "MailLogStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "MailQueueJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'chrome_extension',
    "extension_version" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "priority" "TicketPriority" NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "sender_phone" TEXT,
    "paketci_package_id" TEXT,
    "paketci_order_number" TEXT,
    "paketci_detail_url" TEXT,
    "created_from_url" TEXT,
    "duplicate_of_ticket_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_snapshots" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "paketci_package_id" TEXT,
    "order_number" TEXT,
    "restaurant_name" TEXT,
    "branch_name" TEXT,
    "courier_name" TEXT,
    "package_status" TEXT,
    "delivery_status" TEXT,
    "payment_type" TEXT,
    "package_total" TEXT,
    "customer_name_masked" TEXT,
    "customer_phone_masked" TEXT,
    "customer_address_masked" TEXT,
    "package_created_at" TEXT,
    "paketci_detail_url" TEXT,
    "raw_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_logs" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "subject" TEXT NOT NULL,
    "status" "MailLogStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_queue_jobs" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "MailQueueJobStatus" NOT NULL DEFAULT 'queued',
    "payload" JSONB NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_queue_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "support_tickets_paketci_package_id_idx" ON "support_tickets"("paketci_package_id");

-- CreateIndex
CREATE INDEX "support_tickets_paketci_order_number_idx" ON "support_tickets"("paketci_order_number");

-- CreateIndex
CREATE INDEX "support_tickets_sender_email_idx" ON "support_tickets"("sender_email");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "package_snapshots_ticket_id_key" ON "package_snapshots"("ticket_id");

-- CreateIndex
CREATE INDEX "mail_logs_ticket_id_status_idx" ON "mail_logs"("ticket_id", "status");

-- CreateIndex
CREATE INDEX "mail_queue_jobs_ticket_id_status_idx" ON "mail_queue_jobs"("ticket_id", "status");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_duplicate_of_ticket_id_fkey" FOREIGN KEY ("duplicate_of_ticket_id") REFERENCES "support_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_snapshots" ADD CONSTRAINT "package_snapshots_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_logs" ADD CONSTRAINT "mail_logs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_queue_jobs" ADD CONSTRAINT "mail_queue_jobs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

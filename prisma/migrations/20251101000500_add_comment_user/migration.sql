-- AlterTable: add userId to Comment and FK to User(id)
ALTER TABLE "Comment" ADD COLUMN "userId" TEXT;

CREATE INDEX "Comment_userId_idx" ON "Comment" ("userId");

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


